# MFG Stack Lab V2 — Commercial Event Schema

## Principle

Every event is useful only if it supports attribution from discovery to revenue. Diagnostics and commercial truth must remain separate.

## Canonical identifiers

- `session_id`: anonymous/user session identifier
- `company_id`: normalized company/domain key
- `lead_id`: created only after identifiable buyer information is legitimately captured
- `fit_id`: immutable fit-evaluation snapshot
- `opportunity_id`: vendor/paid commercial opportunity
- `order_id`: genuine closed commercial conversion
- `revenue_id`: accrued/received revenue event
- `source_id`: acquisition source/campaign/content/advisor/vendor/outbound source

## Event envelope

Every event should contain where available:

- `event_name`
- `event_at`
- `session_id`
- `company_domain`
- `lead_id`
- `fit_id`
- `opportunity_id`
- `source_type`
- `source_detail`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `country`
- `consent_state`
- `evidence_state`
- `metadata`

## Funnel events

### Discovery / product diagnostics

- `LANDING_VIEW`
- `DECISION_ENGINE_VIEW`
- `URL_SUBMITTED`
- `COMPANY_RESOLUTION_STARTED`
- `COMPANY_RESOLUTION_SUCCEEDED`
- `COMPANY_RESOLUTION_FAILED`
- `MISSING_FACT_ASKED`
- `MISSING_FACT_ANSWERED`
- `MAP_STARTED`
- `MAP_COMPLETED`
- `MAP_COMPLETED_LOCAL_BETA`
- `MAP_ABANDONED`

These are diagnostics, not orders.

### Buyer qualification

- `IDENTIFIABLE_BUYER_CAPTURED`
- `QUALIFIED_INBOUND`
- `QB_CREATED`
- `DECISION_ARTIFACT_DELIVERED`

### Commercial routing

- `VENDOR_FIT_SHOWN`
- `REFERRAL_CONSENT_REQUESTED`
- `REFERRAL_CONSENT_GRANTED`
- `REFERRAL_CLICK`
- `VENDOR_LEAD_REGISTERED`
- `PAID_PRODUCT_SHOWN`
- `CHECKOUT_STARTED`
- `PAID_PURCHASE`

### Vendor subscription / revenue

- `ATTRIBUTED_VENDOR_SUBSCRIPTION`
- `COMMISSION_ACCRUED`
- `COMMISSION_APPROVED`
- `COMMISSION_SETTLED`
- `SELLER_INTRO_ACCEPTED`
- `CLOSED_ORDER`
- `REVENUE_RECEIVED`

## Commercial truth rules

`CLOSED_ORDER` may be emitted only if one of these is evidenced:

1. buyer purchased a paid MFG Stack Lab offer;
2. vendor explicitly accepted a paid Qualified Buyer Introduction/referral;
3. attributable paid vendor purchase/subscription created an evidenced commission entitlement.

`REVENUE_RECEIVED` requires settlement/payment evidence.

No `CLOSED_ORDER` for:

- page view;
- URL submission;
- map completion;
- reply;
- meeting;
- demo request;
- free trial;
- partner approval alone.

## Cohort fields

Every acquisition-side record must identify exactly one primary cohort:

- `INBOUND_SEARCH`
- `INBOUND_AI_SEARCH`
- `INBOUND_DIRECT`
- `ADVISOR_REFERRAL`
- `VENDOR_REFERRAL`
- `OUTBOUND_CLEAN_DECISION_OWNER`
- `OUTBOUND_ROUTING`
- `OTHER_VERIFIED`

Do not combine routing inbox performance with clean decision-owner outbound performance.

## Minimum V2 dashboard

The first production dashboard should show:

1. Decision Engine sessions
2. URL submissions
3. Map completion rate
4. Qualified Inbound
5. QB Yield
6. Referral consent rate
7. Referral click rate
8. Paid-product conversion
9. Attributed vendor subscriptions
10. Closed Orders
11. Commission accrued
12. Revenue received
13. Revenue by acquisition cohort
14. Revenue / 100 qualified sessions or clean prospects

## Privacy / minimization

Before a visitor identifies themselves, analytics should avoid unnecessary personal data. Do not store full scraped website content by default; store the evidence facts, source URLs, timestamps and hashes/structured extraction required to support the decision. Buyer-identifiable data must inherit consent and retention rules.
