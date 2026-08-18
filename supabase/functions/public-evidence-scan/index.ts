import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MAX_BYTES = 1_000_000;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 8_000;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  },
});

function isBlockedIPv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b, c] = p;
  return a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224;
}

function isBlockedIPv6(ip: string): boolean {
  const x = ip.toLowerCase();
  if (x === "::" || x === "::1" || x.startsWith("fe80:") ||
      x.startsWith("fc") || x.startsWith("fd") || x.startsWith("ff") ||
      x.startsWith("2001:db8:")) return true;

  // Reject IPv4-mapped IPv6 forms if the embedded IPv4 is private/special.
  const mapped = x.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) return isBlockedIPv4(mapped[1]);
  return false;
}

function isIpLiteral(host: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.includes(":");
}

async function assertPublicHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") ||
      host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("blocked_host");
  }

  if (isIpLiteral(host)) {
    if (host.includes(":")) {
      if (isBlockedIPv6(host)) throw new Error("blocked_ip");
    } else if (isBlockedIPv4(host)) {
      throw new Error("blocked_ip");
    }
    return;
  }

  const resolved: string[] = [];
  for (const recordType of ["A", "AAAA"] as const) {
    try {
      const rows = await Deno.resolveDns(host, recordType);
      for (const row of rows) resolved.push(String(row));
    } catch {
      // A public site can legitimately publish only one address family.
    }
  }
  if (!resolved.length) throw new Error("dns_unresolved");

  for (const ip of resolved) {
    if (ip.includes(":")) {
      if (isBlockedIPv6(ip)) throw new Error("blocked_dns_target");
    } else if (isBlockedIPv4(ip)) {
      throw new Error("blocked_dns_target");
    }
  }
}

async function validateUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("invalid_url");
  }

  if (!["http:", "https:"].includes(url.protocol)) throw new Error("invalid_scheme");
  if (url.username || url.password) throw new Error("credentials_not_allowed");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("port_not_allowed");
  await assertPublicHost(url.hostname);
  return url;
}

async function readBoundedBody(res: Response): Promise<string> {
  const declared = Number(res.headers.get("content-length") || 0);
  if (declared && declared > MAX_BYTES) throw new Error("response_too_large");
  if (!res.body) return "";

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new Error("response_too_large");
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
}

async function fetchPublic(start: URL): Promise<{ url: URL; body: string; contentType: string }> {
  let current = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    // Re-resolve before every redirect hop and fail closed on private/special targets.
    current = await validateUrl(current.toString());

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": "MFGStackLab-EvidenceBot/0.2 (+https://straggler-liu.github.io/mfg-stack-lab/)",
          "accept": "text/html,text/plain;q=0.8",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get("location");
      if (!location) throw new Error("redirect_without_location");
      if (hop === MAX_REDIRECTS) throw new Error("too_many_redirects");
      current = new URL(location, current);
      continue;
    }

    if (!res.ok) throw new Error(`upstream_${res.status}`);
    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      throw new Error("unsupported_content_type");
    }

    return { url: current, body: await readBoundedBody(res), contentType };
  }
  throw new Error("too_many_redirects");
}

function decodeBasicEntities(s: string) {
  return s.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}

function extractPage(html: string) {
  const title = decodeBasicEntities(
    (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "")
      .replace(/\s+/g, " ").trim(),
  ).slice(0, 240);

  const description = decodeBasicEntities((
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ||
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1] || ""
  ).replace(/\s+/g, " ").trim()).slice(0, 500);

  const text = decodeBasicEntities(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ").trim()).slice(0, 30_000);

  return { title, description, text };
}

const TERM_GROUPS: Record<string, string[]> = {
  manufacturing: ["manufactur", "fabricat", "machine shop", "job shop", "assembly", "cnc"],
  inventory: ["inventory", "warehouse", "stock", "purchasing", "procurement"],
  production: ["production", "work order", "schedule", "capacity", "bom", "bill of materials", "mrp"],
  traceability: ["batch", "lot", "traceability", "serial"],
  systems: ["erp", "quickbooks", "xero", "mes", "wms", "shopify"],
};

function detectSignals(text: string) {
  const lower = text.toLowerCase();
  const detectedTerms: string[] = [];
  const groups: string[] = [];

  for (const [group, terms] of Object.entries(TERM_GROUPS)) {
    const hits = terms.filter((term) => lower.includes(term));
    if (hits.length) {
      groups.push(group);
      detectedTerms.push(...hits.slice(0, 4));
    }
  }

  const manufacturingHits = TERM_GROUPS.manufacturing.filter((term) => lower.includes(term)).length;
  const manufacturingLikelihood = manufacturingHits >= 2 ? "HIGH" : manufacturingHits === 1 ? "MEDIUM" : "UNKNOWN";

  return {
    manufacturing_likelihood: manufacturingLikelihood,
    detected_groups: groups,
    detected_terms: [...new Set(detectedTerms)].slice(0, 20),
  };
}

function evidenceItems(text: string, sourceUrl: string, retrievedAt: string) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.length >= 30 && s.length <= 500);
  const allTerms = Object.values(TERM_GROUPS).flat();
  const relevant = sentences
    .filter((s) => allTerms.some((term) => s.toLowerCase().includes(term)))
    .slice(0, 8);

  return relevant.map((excerpt) => ({
    fact: excerpt,
    source_url: sourceUrl,
    retrieved_at: retrievedAt,
    evidence_type: "PUBLIC_WEBSITE",
    confidence: "MEDIUM",
    claim_type: "FACT",
  }));
}

function nextMissingFact(input: Record<string, unknown>, signals: ReturnType<typeof detectSignals>) {
  const currentSystem = String(input.current_system || "unknown");
  const constraint = String(input.primary_constraint || "unknown");
  const model = String(input.production_model || "unknown");
  const timing = String(input.decision_timing || "unknown");

  if (currentSystem === "unknown") return "What system currently runs purchasing, inventory and production?";
  if (constraint === "unknown") return "Which operating decision is failing most often: inventory, planning, costing, traceability, integration, or rollout stability?";
  if (model === "unknown") return "Is production mainly simple assembly, batch/make-to-stock, make-to-order/job shop, or multi-site/complex?";
  if (timing === "unknown") return "Is this an active 0–30 day decision, a 31–90 day evaluation, or longer-term research?";
  if (constraint === "planning" || signals.detected_groups.includes("production")) return "Do multi-level BOMs, routings or finite-capacity constraints materially drive purchasing and promised ship dates?";
  if (constraint === "traceability" || signals.detected_groups.includes("traceability")) return "Is lot/batch genealogy required only for finished goods, or through raw materials and intermediate production steps?";
  if (currentSystem === "erp") return "Is the main gap product capability, configuration, master data, integration, adoption, or process ownership?";
  return "Which single workflow still requires a spreadsheet, duplicate entry, or offline decision after the current system is used correctly?";
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json({ ok: false, error: "json_required" }, 415);
  }

  try {
    const input = await req.json();
    const raw = typeof input?.company_url === "string" ? input.company_url.trim() : "";
    if (!raw || raw.length > 2048) return json({ ok: false, error: "invalid_url" }, 400);

    const start = await validateUrl(raw);
    const fetched = await fetchPublic(start);
    const page = extractPage(fetched.body);
    const retrievedAt = new Date().toISOString();
    const sourceUrl = fetched.url.toString();
    const signals = detectSignals(`${page.title} ${page.description} ${page.text}`);
    const evidence = evidenceItems(page.text, sourceUrl, retrievedAt);

    return json({
      ok: true,
      schema_version: "p2b.public-evidence.v1",
      company: {
        submitted_url: start.toString(),
        normalized_domain: fetched.url.hostname.toLowerCase().replace(/^www\./, ""),
        page_title: page.title,
        meta_description: page.description,
      },
      evidence,
      signals,
      evidence_boundary: "Only the submitted public homepage was fetched. Returned excerpts are public-page facts; no internal company facts are asserted.",
      next: {
        missing_fact: nextMissingFact(input, signals),
      },
      retrieval: {
        final_url: sourceUrl,
        retrieved_at: retrievedAt,
        content_type: fetched.contentType,
      },
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "scan_failed";
    const safe = /^(invalid_|blocked_|dns_|credentials_|port_|response_|unsupported_|redirect_|too_many_|upstream_)/.test(code)
      ? code
      : "scan_failed";
    return json({ ok: false, error: safe }, safe.startsWith("upstream_") ? 502 : 400);
  }
});
