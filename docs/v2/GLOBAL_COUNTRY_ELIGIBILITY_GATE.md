# Global Country Eligibility & Localization Gate

Status: V2 operating doctrine. Applies before country-specific vendor recommendations, paid offers, localized assets, referrals, or outbound activity.

## Core principle

MFG Stack Lab is global-inbound by default, not English-country-only. Country prioritization is evidence-driven by buyer demand, manufacturing SMB density, vendor availability, downstream QB yield and Closed Order yield. Language alone must never exclude a buyer or geography.

## Operating layers

### A. Immediate global discovery

All countries may generate inbound, Qualified Buyers, advisor referrals and self-serve Decision Engine sessions when at least one relevant software category can be evaluated accurately. Never reject a buyer solely because English is not the dominant local language.

### B. Localization priority

Localization effort is allocated only when there is a real decision difference or measurable demand. Triggers include any one of:

- >=1 attributable Qualified Buyer from the country;
- repeated high-intent search/query evidence;
- a material local accounting, tax, integration or implementation difference;
- a vendor with strong verified local availability and support;
- repeated buyer questions that cannot be answered safely with a global-neutral page.

Do not mass-create translated doorway pages. Published localized assets must add local decision value: pricing, tax/accounting boundary, implementation constraints, local integrations, support language, currency or vendor availability.

### C. Outbound compliance

US remains the default direct-outbound market. UK unsolicited B2B electronic mail is eligible only for verified corporate subscribers under the current UK compliance gate. Every other jurisdiction is inbound/advisor/referral-first until current local B2B electronic-marketing/privacy rules are separately verified and encoded. A public email address is never sufficient evidence of outreach legality.

## Country recommendation gate

Before naming or ranking a vendor for a buyer in a specific country, verify current evidence for all material fields below:

1. **Commercial availability** — vendor accepts customers in the country and does not exclude the buyer's entity/location.
2. **Implementation/support availability** — remote/local onboarding, support hours and any reseller/partner dependency.
3. **Language** — buyer-facing interface, documentation and support language relevant to implementation risk.
4. **Currency & payment** — supported billing currency, payment method and material FX/contract implications.
5. **Tax/accounting** — VAT/GST/sales-tax handling, local accounting-system boundary and statutory constraints where relevant.
6. **Integrations** — required accounting, ecommerce, payments, shipping, EDI, payroll or local ecosystem integrations.
7. **Feature parity** — country/edition-specific differences; never assume US features or pricing apply globally.
8. **Pricing** — current local/region-specific pricing where available; otherwise label pricing as unverified for that market.
9. **Data/hosting constraints** — only when material to buyer requirements or local law; do not invent compliance claims.
10. **Manufacturing fit** — BOM/routing, planning, job costing, traceability, scheduling and operational requirements remain independent of commercial relationships.

If any blocking field is unresolved, return **CATEGORY-LEVEL ONLY** rather than a false vendor recommendation.

## Evidence statuses

Every country/vendor eligibility record should carry one of:

- `VERIFIED_CURRENT` — current first-party/vendor evidence supports availability and relevant constraints.
- `PARTIALLY_VERIFIED` — some material fields verified; unresolved fields are explicitly listed.
- `UNVERIFIED` — insufficient current evidence; vendor must not be recommended as country-safe.
- `NOT_SUPPORTED` — current evidence shows the vendor/product is unavailable or unsuitable in that country.

Record source URL, observed date, product/edition and the exact claim supported by the source.

## Initial research pool

The initial evidence queue includes: US, UK, Canada, Australia, New Zealand, Singapore, Ireland, South Africa, Germany, France, Spain, Italy, Mexico, Brazil, Netherlands, Belgium, Switzerland, Austria, Nordics, Poland, Czechia, Turkey, UAE/Gulf, Japan, South Korea, Taiwan, Hong Kong, Malaysia, Indonesia and India, plus any country producing real inbound demand.

This is a research pool, not a ranking. Actual localization priority must be reallocated by Qualified Buyer yield and Closed Order yield, not traffic alone.

## Decision Engine behavior

Before vendor names are shown, the Decision Engine should determine:

1. company country if voluntarily supplied or reliably evidenced from business records;
2. required accounting/tax/integration boundary;
3. manufacturing model and operational requirements;
4. whether current country/vendor evidence is fresh enough to support a recommendation.

Never infer a buyer's location from IP for commercial attribution. IP may be used only for security/rate-limiting where permitted and should not become a country-of-buyer truth field.

## Fit neutrality

Country eligibility is a feasibility filter, not a commercial ranking variable. Compensation, affiliate status, referral terms or vendor partnership must not raise Fit Score, suppress a better option or change recommendation order. Commercial routing happens only after fit order is fixed.

## Referral gate

Buyer-identifiable information may be shared with a vendor only when all are true:

- vendor/product fit was determined independently;
- country eligibility is `VERIFIED_CURRENT` or sufficient `PARTIALLY_VERIFIED` evidence covers all buyer-critical fields;
- buyer explicitly consents;
- a valid referral/commercial route exists;
- consent and referral events are persisted with idempotent identifiers.

## Localization quality gate

A localized page may publish only when it adds at least one local decision difference and has current evidence for its product claims. Native-language terminology should follow how local buyers actually search and buy, not literal English translation. Machine translation may assist drafting, but factual/product constraints must survive unchanged.

## Measurement

Track Qualified Buyer, Decision Map completion, referral consent, Closed Order and revenue by source page, country and language only when voluntarily supplied or reliably evidenced from business records. Rank geographies by downstream conversion, not sessions or pageviews alone.
