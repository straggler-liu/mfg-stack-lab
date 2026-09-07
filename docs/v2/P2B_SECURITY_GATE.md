# P2B Public Evidence Scan — Security & Acceptance Gate

Status: **NOT PRODUCTION-APPROVED**

The V2 company-scan Edge Function exists as an auditable implementation candidate. Writing code is not completion. Deployment and production exposure remain blocked until all gates below pass.

## Purpose

Accept a buyer-submitted public company URL, retrieve only public HTML, extract bounded factual evidence, persist an auditable session/evidence trail, and return facts without pretending to access private systems.

## Current controls

- HTTP/HTTPS only.
- URLs containing embedded credentials are rejected.
- localhost, loopback, RFC1918 IPv4, link-local, CGNAT, multicast/reserved IPv4, IPv6 loopback/link-local/ULA literals are rejected.
- DNS A records are checked through a public resolver and any private IPv4 result fails closed.
- Every redirect target is revalidated.
- Maximum 3 redirects.
- 6-second upstream timeout.
- 500 KB maximum HTML body.
- HTML/XHTML content only.
- Browser origin allowlist.
- Per-IP-hash hourly rate limit.
- IP and user-agent stored only as one-way SHA-256 hashes with application-specific prefixes.
- Database is not directly exposed to anonymous/authenticated clients; Edge Function uses backend credentials.
- Extracted evidence is stored as FACT; no model inference is silently promoted to fact.
- On scan failure, response explicitly returns `SCAN_NOT_COMPLETED`.
- No private account, authenticated page, intranet, file, ftp, cloud metadata or browser-cookie access is intended or permitted.

## Residual security risk — blocking gate

The current implementation validates DNS through a public resolver and then performs a normal fetch to the hostname. A hostile domain could theoretically change its DNS answer between validation and connection (DNS rebinding / time-of-check-to-time-of-use gap).

Therefore this implementation must **not** be labeled SSRF-proof or production-safe until one of these is completed:

1. deploy behind an outbound fetch service/proxy that guarantees public-IP-only egress and redirect revalidation; or
2. demonstrate an Edge Runtime mechanism that pins the validated public IP while preserving correct TLS hostname validation; or
3. complete an equivalent network-level egress policy that cannot reach private/link-local/metadata networks.

Until then P2B may be staged for controlled testing against known benign URLs only, but must not be opened as an unrestricted public URL fetcher.

## Database gate

Required before function deployment:

- apply `supabase/migrations/20260818_mfg_v2_core_schema.sql`;
- confirm all MFG tables have RLS enabled;
- confirm `anon` and `authenticated` have no direct table privileges;
- confirm only backend/service credentials can write;
- run Supabase security advisor after migration;
- verify no unexpected public policies exist.

## Functional acceptance tests

Must pass:

1. known public manufacturer homepage -> 200 and factual title/description evidence;
2. malformed URL -> fail closed;
3. ftp/file/data/javascript schemes -> fail closed;
4. localhost / 127.0.0.1 / 10.0.0.0/8 / 169.254.0.0/16 / 192.168.0.0/16 -> fail closed;
5. private DNS answer -> fail closed;
6. redirect to private/blocked target -> fail closed;
7. >500KB body -> fail closed;
8. non-HTML content -> fail closed;
9. timeout -> fail closed;
10. disallowed browser Origin -> 403;
11. hourly rate threshold -> 429;
12. failed scan must not claim public evidence was retrieved;
13. repeated commercial events must respect idempotency constraints.

## Evidence boundary

The API response must distinguish:

- `facts`: directly extracted public-page evidence;
- `inference`: model/rule-derived interpretation, if added later;
- `evidence_boundary`: what was actually accessed.

No output may imply access to ERP, CRM, accounting, private LinkedIn, employee inboxes, internal documents, authenticated portals or other non-public systems.

## Production release condition

P2B = PASS only after database, security, SSRF/egress, functional, logging and rollback gates all pass. Until then Draft PR #20 must remain unmerged and the production homepage must not promise automatic website research.
