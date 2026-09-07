# MFG V2 — Public Evidence Scan API Contract

## Objective

Convert a submitted public company website into a small, auditable evidence object that can safely improve an Initial Decision Map.

The backend must not claim access to non-public internal facts.

## Endpoint

`POST /company-intake`

### Request

```json
{
  "company_url": "https://example.com",
  "current_system": "quickbooks|spreadsheets|inventory|mrp|erp|unknown",
  "primary_constraint": "inventory|planning|costing|traceability|integration|stabilization|unknown",
  "production_model": "simple|batch|mto|complex|unknown",
  "decision_timing": "0-30|31-90|90plus|unknown"
}
```

## Response

```json
{
  "ok": true,
  "company": {
    "submitted_url": "https://example.com",
    "normalized_domain": "example.com",
    "page_title": "Example Manufacturing",
    "meta_description": "..."
  },
  "evidence": [
    {
      "fact": "Homepage describes contract manufacturing and assembly",
      "source_url": "https://example.com/",
      "retrieved_at": "2026-08-18T00:00:00Z",
      "evidence_type": "PUBLIC_WEBSITE",
      "confidence": "MEDIUM"
    }
  ],
  "signals": {
    "manufacturing_likelihood": "HIGH|MEDIUM|LOW|UNKNOWN",
    "detected_terms": ["manufacturing", "assembly", "inventory"]
  },
  "evidence_boundary": "Only the submitted public website page was fetched. No internal company data was accessed.",
  "next": {
    "missing_fact": "..."
  }
}
```

## V0 evidence scope

V0 fetches only the submitted site's normalized public homepage. It does not crawl the whole domain.

Later versions may follow a small allowlisted set of same-domain links such as:

- `/about`
- `/manufacturing`
- `/capabilities`
- `/products`
- `/industries`

but only after cost/latency/robots/abuse controls are validated.

## SSRF / network safety — hard gate

The backend accepts only `http` / `https` company URLs and MUST reject:

- localhost;
- loopback addresses;
- RFC1918/private IPv4;
- link-local ranges;
- metadata-service addresses;
- IPv6 loopback/link-local/private ranges;
- non-standard URL schemes;
- redirects that resolve to blocked/private hosts.

Additional limits:

- one homepage fetch per request in V0;
- redirect cap;
- strict timeout;
- maximum response bytes;
- HTML/text content types only;
- no JavaScript execution;
- no credential forwarding;
- no cookies from the visitor;
- no arbitrary request headers supplied by the visitor.

## Evidence discipline

The system may infer a decision hypothesis from public evidence, but it must label inference separately from verified facts.

Do not turn:

`"we manufacture X"`

into:

`"they use multi-level BOMs"`

without additional evidence.

## Privacy / retention

Before buyer identification, persist only what is required for product analytics and evidence replay:

- normalized domain;
- structured extracted facts;
- source URL;
- retrieval timestamp;
- hashes / retrieval status;
- non-identifying session reference.

Do not store complete third-party page copies by default.

## Acceptance criteria

P2B is PASS only when:

1. real public sites can be fetched successfully;
2. private/local/metadata targets are rejected;
3. timeouts and oversized responses fail closed;
4. response states clearly distinguish fact vs inference;
5. frontend never claims research when fetch failed;
6. the same input can be replayed/audited;
7. an automated test set includes valid manufacturing sites and malicious/invalid URL cases.
