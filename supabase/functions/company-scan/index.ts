import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED_ORIGINS = new Set([
  'https://straggler-liu.github.io',
  'https://straggler-liu.github.io/mfg-stack-lab',
]);
const MAX_BODY_BYTES = 20_000;
const MAX_HTML_BYTES = 500_000;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 6_000;
const RATE_LIMIT_PER_HOUR = 12;

function cors(origin: string | null) {
  const allow = origin && [...ALLOWED_ORIGINS].some((o) => origin === o || origin.startsWith(o + '/')) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'content-type, x-requested-with',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  };
}

function json(status: number, body: unknown, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: cors(origin) });
}

function isPrivateV4(ip: string) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) return false;
  return p[0] === 10 || p[0] === 127 || p[0] === 0 ||
    (p[0] === 169 && p[1] === 254) ||
    (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
    (p[0] === 192 && p[1] === 168) ||
    (p[0] === 100 && p[1] >= 64 && p[1] <= 127) ||
    p[0] >= 224;
}

function isBlockedHostLiteral(host: string) {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost') || h === '0.0.0.0') return true;
  if (isPrivateV4(h)) return true;
  if (h === '::1' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80:')) return true;
  return false;
}

async function sha256(s: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

async function resolvePublic(hostname: string) {
  if (isBlockedHostLiteral(hostname)) throw new Error('blocked_target');
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`;
  const r = await fetch(url, { headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(3500) });
  if (!r.ok) throw new Error('dns_failed');
  const j = await r.json();
  const ips = Array.isArray(j.Answer) ? j.Answer.map((x: any) => String(x.data || '')).filter(Boolean) : [];
  if (!ips.length) throw new Error('dns_no_public_a');
  if (ips.some(isPrivateV4)) throw new Error('blocked_target');
}

function normalizeInputUrl(raw: string) {
  const u = new URL(raw.trim());
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('invalid_scheme');
  if (u.username || u.password) throw new Error('credentials_not_allowed');
  if (isBlockedHostLiteral(u.hostname)) throw new Error('blocked_target');
  u.hash = '';
  return u;
}

async function boundedText(resp: Response) {
  const len = Number(resp.headers.get('content-length') || 0);
  if (len && len > MAX_HTML_BYTES) throw new Error('response_too_large');
  const reader = resp.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.length;
    if (total > MAX_HTML_BYTES) {
      reader.cancel();
      throw new Error('response_too_large');
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { merged.set(c, off); off += c.length; }
  return new TextDecoder('utf-8', { fatal: false }).decode(merged);
}

async function safeFetch(start: URL) {
  let current = start;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await resolvePublic(current.hostname);
    const resp = await fetch(current.toString(), {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'MFGStackLab-EvidenceBot/0.1 (+https://straggler-liu.github.io/mfg-stack-lab/)',
        'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if ([301, 302, 303, 307, 308].includes(resp.status)) {
      const loc = resp.headers.get('location');
      if (!loc) throw new Error('redirect_without_location');
      current = new URL(loc, current);
      if (!['http:', 'https:'].includes(current.protocol)) throw new Error('invalid_redirect_scheme');
      continue;
    }
    if (!resp.ok) throw new Error(`upstream_${resp.status}`);
    const ct = (resp.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('text/html') && !ct.includes('application/xhtml+xml')) throw new Error('unsupported_content_type');
    return { finalUrl: current.toString(), html: await boundedText(resp) };
  }
  throw new Error('too_many_redirects');
}

function cleanText(s: string) {
  return s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function extract(html: string) {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim().slice(0, 240);
  const meta = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)?.[1]
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i)?.[1]
    || '';
  const text = cleanText(html).slice(0, 18_000);
  const terms = ['manufactur', 'production', 'factory', 'machining', 'fabrication', 'assembly', 'batch', 'inventory', 'warehouse', 'erp', 'mrp', 'mes', 'quickbooks', 'syspro', 'epicor', 'infor', 'dynamics 365', 'netsuite'];
  const hits = terms.filter((t) => text.toLowerCase().includes(t));
  return { title, description: meta.slice(0, 500), textExcerpt: text.slice(0, 3500), keywordHits: hits };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' }, origin);
  if (!origin || ![...ALLOWED_ORIGINS].some((o) => origin === o || origin.startsWith(o + '/'))) {
    return json(403, { ok: false, error: 'origin_not_allowed' }, origin);
  }
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) return json(413, { ok: false, error: 'request_too_large' }, origin);

  try {
    const body = await req.json();
    const companyUrl = String(body?.company_url || '');
    const currentSystem = String(body?.current_system || '').slice(0, 120);
    const model = String(body?.manufacturing_model || '').slice(0, 80);
    const constraint = String(body?.primary_constraint || '').slice(0, 160);
    const decisionWindow = String(body?.decision_window || '').slice(0, 60);
    const target = normalizeInputUrl(companyUrl);

    const ipRaw = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    const uaRaw = req.headers.get('user-agent') || 'unknown';
    const ipHash = await sha256(`mfg-v2-ip:${ipRaw}`);
    const uaHash = await sha256(`mfg-v2-ua:${uaRaw}`);
    const now = new Date();
    const hourStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours())).toISOString();

    const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
    const secretKey = secretKeys['default'] || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!secretKey) throw new Error('backend_secret_missing');
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: existing } = await sb.from('mfg_rate_limits').select('request_count').eq('key_hash', ipHash).eq('route', 'company-scan').eq('window_start', hourStart).maybeSingle();
    const n = Number(existing?.request_count || 0);
    if (n >= RATE_LIMIT_PER_HOUR) return json(429, { ok: false, error: 'rate_limited' }, origin);
    if (existing) {
      await sb.from('mfg_rate_limits').update({ request_count: n + 1, updated_at: new Date().toISOString() }).eq('key_hash', ipHash).eq('route', 'company-scan').eq('window_start', hourStart);
    } else {
      await sb.from('mfg_rate_limits').insert({ key_hash: ipHash, route: 'company-scan', window_start: hourStart, request_count: 1 });
    }

    const { data: session, error: sessionErr } = await sb.from('mfg_decision_sessions').insert({
      company_url: target.toString(), normalized_domain: target.hostname.toLowerCase(), current_system: currentSystem || null,
      manufacturing_model: model || null, primary_constraint: constraint || null, decision_window: decisionWindow || null,
      ip_hash: ipHash, user_agent_hash: uaHash, metadata: { evidence_boundary: 'PUBLIC_WEBSITE_ONLY' }
    }).select('id').single();
    if (sessionErr) throw sessionErr;

    const fetched = await safeFetch(target);
    const ex = extract(fetched.html);
    const observedAt = new Date().toISOString();
    const evidence = [
      { field_name: 'page_title', value_text: ex.title || '(none)', excerpt: ex.title || null },
      { field_name: 'meta_description', value_text: ex.description || '(none)', excerpt: ex.description || null },
      { field_name: 'keyword_hits', value_text: ex.keywordHits.join(', ') || '(none)', excerpt: ex.textExcerpt.slice(0, 800) || null },
    ].map((e) => ({ session_id: session.id, source_url: fetched.finalUrl, observed_at: observedAt, evidence_kind: 'FACT', confidence: 1, ...e }));
    const { error: evidenceErr } = await sb.from('mfg_evidence_items').insert(evidence);
    if (evidenceErr) throw evidenceErr;

    await sb.from('mfg_decision_sessions').update({ status: 'SCANNED', updated_at: observedAt }).eq('id', session.id);
    await sb.from('mfg_commercial_events').insert({ session_id: session.id, event_name: 'PUBLIC_EVIDENCE_SCANNED', source: 'decision-engine-v2', idempotency_key: `scan:${session.id}`, metadata: { final_url: fetched.finalUrl } });

    return json(200, {
      ok: true,
      session_id: session.id,
      evidence_boundary: 'PUBLIC_WEBSITE_ONLY',
      final_url: fetched.finalUrl,
      facts: { title: ex.title, description: ex.description, keyword_hits: ex.keywordHits, text_excerpt: ex.textExcerpt },
      inference: null,
      note: 'Facts above were extracted from the submitted company public website. No private systems or non-public data were accessed.'
    }, origin);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'scan_failed';
    const publicError = ['invalid_scheme','credentials_not_allowed','blocked_target','dns_failed','dns_no_public_a','response_too_large','unsupported_content_type','too_many_redirects'].includes(message) ? message : 'scan_failed';
    return json(400, { ok: false, error: publicError, evidence_boundary: 'SCAN_NOT_COMPLETED' }, origin);
  }
});
