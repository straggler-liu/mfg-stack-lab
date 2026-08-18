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
  const [a, b] = p;
  return a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224;
}

function isBlockedIPv6(ip: string): boolean {
  const x = ip.toLowerCase();
  return x === "::" || x === "::1" || x.startsWith("fe80:") ||
    x.startsWith("fc") || x.startsWith("fd") || x.startsWith("ff") ||
    x.startsWith("2001:db8:");
}

function isIpLiteral(host: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.includes(":");
}

async function assertPublicHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("blocked_host");
  }
  if (isIpLiteral(host)) {
    if (host.includes(":")) {
      if (isBlockedIPv6(host)) throw new Error("blocked_ip");
    } else if (isBlockedIPv4(host)) throw new Error("blocked_ip");
    return;
  }

  const resolved: string[] = [];
  for (const recordType of ["A", "AAAA"] as const) {
    try {
      const rows = await Deno.resolveDns(host, recordType);
      for (const row of rows) resolved.push(String(row));
    } catch {
      // A site may legitimately have only A or only AAAA. Require at least one public answer overall.
    }
  }
  if (!resolved.length) throw new Error("dns_unresolved");
  for (const ip of resolved) {
    if (ip.includes(":")) {
      if (isBlockedIPv6(ip)) throw new Error("blocked_dns_target");
    } else if (isBlockedIPv4(ip)) throw new Error("blocked_dns_target");
  }
}

async function validateUrl(raw: string): Promise<URL> {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("invalid_url"); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("invalid_scheme");
  if (url.username || url.password) throw new Error("credentials_not_allowed");
  if (url.port && !['80', '443'].includes(url.port)) throw new Error("port_not_allowed");
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
  for (const c of chunks) { merged.set(c, offset); offset += c.byteLength; }
  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
}

async function fetchPublic(start: URL): Promise<{ url: URL; body: string; contentType: string }> {
  let current = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
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
          "user-agent": "MFGStackLab-EvidenceBot/0.1 (+https://straggler-liu.github.io/mfg-stack-lab/)",
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
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) throw new Error("unsupported_content_type");
    return { url: current, body: await readBoundedBody(res), contentType };
  }
  throw new Error("too_many_redirects");
}

function decodeBasicEntities(s: string) {
  return s.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}

function extractEvidence(html: string) {
  const title = decodeBasicEntities((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/\s+/g, " ").trim()).slice(0, 240);
  const description = decodeBasicEntities((html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ||
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1] || "").replace(/\s+/g, " ").trim()).slice(0, 500);

  const text = decodeBasicEntities(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ").trim()).slice(0, 30_000);

  const keywords = ["manufactur", "fabricat", "machine shop", "job shop", "assembly", "inventory", "production", "BOM", "MRP", "ERP", "QuickBooks", "Xero", "batch", "lot", "traceability", "CNC", "warehouse"];
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.length >= 30 && s.length <= 500);
  const relevant = sentences.filter((s) => keywords.some((k) => s.toLowerCase().includes(k.toLowerCase()))).slice(0, 12);
  return { title, description, relevant_text: relevant, page_text_excerpt: text.slice(0, 4000) };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) return json({ error: "json_required" }, 415);

  try {
    const input = await req.json();
    const raw = typeof input?.company_url === "string" ? input.company_url.trim() : "";
    if (!raw || raw.length > 2048) return json({ error: "invalid_url" }, 400);

    const start = await validateUrl(raw);
    const fetched = await fetchPublic(start);
    const evidence = extractEvidence(fetched.body);
    return json({
      schema_version: "p2b.public-evidence.v1",
      requested_url: start.toString(),
      final_url: fetched.url.toString(),
      fetched_at: new Date().toISOString(),
      evidence_boundary: "Public homepage text only. No claim is inferred beyond returned excerpts.",
      ...evidence,
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "scan_failed";
    const safe = /^(invalid_|blocked_|dns_|credentials_|port_|response_|unsupported_|redirect_|too_many_|upstream_)/.test(code) ? code : "scan_failed";
    return json({ error: safe }, safe.startsWith("upstream_") ? 502 : 400);
  }
});
