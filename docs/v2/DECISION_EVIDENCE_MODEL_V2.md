# MFG V2 — Decision Evidence Model & Missing-Fact Selection

Status: **V2 DESIGN CONTRACT — PRE-PRODUCTION**

## Objective

Turn a small amount of buyer-supplied context plus bounded public evidence into a useful Initial Decision Map without pretending to know internal operating facts. The system should ask at most 1–2 missing questions, selected for **decision-changing information gain**, not completeness.

## Evidence classes

Every material statement used by the Decision Engine must be tagged as one of:

- `PUBLIC_FACT`: directly evidenced by a public company/vendor source.
- `BUYER_FACT`: explicitly supplied by the buyer.
- `INFERENCE`: derived from one or more facts, with confidence and rationale.
- `UNKNOWN`: decision-relevant fact not yet known.

`INFERENCE` must never be rendered as a verified fact.

## Decision dimensions

The Initial Decision Map evaluates seven operating boundaries. These are not vendor scores.

1. **Inventory control** — purchasing, stock accuracy, locations, replenishment, shortage visibility.
2. **BOM / material planning** — multi-level BOMs, demand explosion, component allocation, substitutes.
3. **Production control** — routings, WIP, work orders, capacity, scheduling, completion reporting.
4. **Costing** — job/actual cost, labor/overhead capture, variance visibility.
5. **Traceability / quality** — lot/serial genealogy, batch records, expiry, inspections, regulated evidence.
6. **Commercial / channel integration** — QuickBooks/Xero, Shopify/e-commerce, CRM, purchasing, shipping.
7. **System-of-record complexity** — multi-site, entities, currencies, permissions, master-data governance.

## Public evidence vocabulary

V0 public-page extraction may identify terms that alter question priority, but not prove internal workflow maturity.

Examples:

| Public evidence | Safe interpretation | Unsafe leap |
|---|---|---|
| CNC machining / job shop / make-to-order | MTO workflow is plausible | company definitely needs finite-capacity scheduling |
| food / batch / ingredients | batch/traceability questions become higher priority | company definitely uses lot tracking today |
| contract manufacturing / assembly | BOM, purchasing and work-order questions become higher priority | company has multi-level BOMs |
| multiple plants / global locations | system-of-record complexity question becomes higher priority | full ERP replacement is required |
| Shopify / ecommerce | channel/inventory synchronization may matter | current inventory is inaccurate |
| aerospace / medical / regulated | quality/traceability question becomes higher priority | a named compliance module is mandatory |

## Missing-fact selection rule

Ask only a fact that can plausibly change the recommended category or boundary. Rank candidate questions by:

`priority = decision_impact × uncertainty × answerability`

Where each factor is ordinal `1–3`:

- **decision_impact**: would the answer switch inventory-first vs MRP vs ERP vs stabilization/integration?
- **uncertainty**: is the fact genuinely unknown after public evidence + buyer facts?
- **answerability**: can a buyer answer quickly without research?

Ask the top question. Ask a second only when the top answer alone cannot resolve a material branch.

## High-information questions by current stack

### QuickBooks / Xero / spreadsheets

Priority branches:

1. `Do you mainly need reliable stock/purchasing, or must the system explode multi-level BOM demand and drive purchasing from production orders?`
2. `Do routings/capacity or promised-date scheduling materially drive daily decisions?`
3. `Do you need lot/serial genealogy or regulated batch/quality records?`

Interpretation:

- stock/purchasing only -> inventory-first remains plausible;
- BOM explosion / production purchasing -> MRP boundary crossed;
- capacity/routings/complex traceability/multi-site governance -> deeper MRP/ERP evaluation.

### Inventory application already in place

Priority branches:

1. `Which production decision is still managed outside the inventory system: BOM planning, scheduling/WIP, costing, or traceability?`
2. `Is duplicate entry into accounting/ecommerce/production systems causing the operational failure?`

Interpretation:

- no production-control gap -> strengthen inventory/integration;
- production planning/control gap -> MRP evaluation;
- governance/entity/multi-site gap -> ERP boundary may be crossed.

### MRP already in place

Priority branches:

1. `Which critical workflow still requires spreadsheets, manual re-entry or offline decisions?`
2. `Is the gap a product capability limit, or mainly master data/configuration/integration/adoption?`

Interpretation:

- implementation/data/integration/adoption -> stabilize current MRP first;
- repeated hard capability boundary -> compare next-tier MRP/ERP.

### ERP already in place

Priority branches:

1. `Is the failure mainly configuration, master data, integration, adoption/process ownership, or a missing product capability?`
2. `Which measurable business workflow is failing despite the current ERP?`

Default rule: replacement is not the default recommendation. Stabilization/integration review precedes replacement unless a documented structural capability gap exists.

## Manufacturing-model modifiers

### Job shop / CNC / high-mix MTO

Raise priority for:

- quote-to-job handoff;
- routing/operation status;
- material allocation to jobs;
- labor/machine actuals;
- promised-date scheduling;
- job profitability.

Do not assume finite-capacity scheduling is necessary unless the buyer says capacity sequencing materially drives delivery decisions.

### Batch / food / chemical / process

Raise priority for:

- formulas/recipes;
- lot genealogy;
- expiry/shelf life;
- yield/scrap;
- batch quality records;
- recall/traceability requirements.

### Assembly / discrete repeat manufacturing

Raise priority for:

- multi-level BOMs;
- component shortages;
- production orders;
- work-center/routing needs;
- engineering/change control where evidenced.

### Multi-site / multi-entity

Raise priority for:

- shared master data;
- intercompany/inter-site transfers;
- role/permission boundaries;
- consolidation/accounting integration;
- system-of-record ownership.

## Initial Decision Map contract

A completed map must contain:

1. `decision_category` — one of `KEEP_LIGHT`, `INVENTORY_FIRST`, `MRP_EVALUATION`, `DEEPER_MRP_ERP_EVALUATION`, `STABILIZE_EXISTING_MRP`, `STABILIZE_EXISTING_ERP`.
2. `known_facts` — fact list with evidence class and source.
3. `decision_boundary` — what operational requirement pushes the buyer into the recommended category.
4. `non_fit_boundary` — what evidence would make the current recommendation wrong.
5. `do_not_overbuy` — explicit scope/risk guardrail.
6. `pilot_workflow` — one end-to-end workflow to test.
7. `missing_fact` — 0–2 high-information questions only.
8. `confidence` — `LOW|MEDIUM|HIGH`, based on evidence completeness, not marketing certainty.
9. `commercial_route` — computed only after fit is finalized.

## Confidence discipline

- `LOW`: core operating boundary depends on an unanswered fact.
- `MEDIUM`: category is reasonably supported but vendor-level fit is not yet proven.
- `HIGH`: category boundary is well evidenced and the remaining uncertainty is implementation/vendor-specific.

A public homepage alone can rarely justify `HIGH`.

## Vendor-neutral routing rule

Vendor scoring and recommendation order occur before commercial routing. Commercial relationships are invisible to fit scoring.

Only after the map is finalized may routing logic ask:

- is this vendor genuinely fit?
- is the buyer's country supported now?
- are local pricing/features/tax/accounting/integration constraints verified?
- did the buyer consent to referral/identity sharing?
- is a valid attribution route available?

If any answer is unknown, do not route commercially.

## Country gate

Before a named vendor recommendation is shown for a buyer outside a previously verified country context, confirm current:

- product availability/support;
- interface/support language;
- currency and local billing;
- tax/VAT/GST implications relevant to purchase/implementation;
- accounting/ecommerce/local integrations;
- materially different pricing/features;
- implementation constraints.

If not verified, return a category-level decision map and mark vendor selection `COUNTRY_VERIFICATION_REQUIRED`.

## Qualification boundary

A Decision Map is useful without becoming a Qualified Buyer. Qualification requires evidence of a real decision context, such as:

- active selection/upgrade/replacement/stabilization decision;
- meaningful unresolved operational problem;
- plausible role or influence in the decision;
- timing indicating a live buying process, normally <=90 days for paid diagnostic routing.

Traffic, URL submission, map generation, vendor click, trial or vague interest alone do not create a QB.

## Commercial upgrade boundary

The free map should resolve the category-level boundary. A paid Deep Diagnostic is appropriate only when a real buyer still has decision risk that requires deeper work, for example:

- 2–4 plausible vendors with non-obvious tradeoffs;
- implementation/integration architecture risk;
- local country/accounting constraints;
- migration/data/governance sequencing;
- TCO/requirements comparison requiring buyer-specific assumptions.

Do not manufacture uncertainty to create an upsell.

## Acceptance tests for the decision model

The test set must include at least:

1. QuickBooks + stock accuracy only -> inventory-first, not ERP.
2. QuickBooks + multi-level BOM + production purchasing -> MRP evaluation.
3. Inventory app + scheduling/WIP gap -> MRP evaluation.
4. Existing MRP + integration/adoption problem -> stabilize current MRP.
5. Existing ERP + master-data problem -> stabilize ERP, not replacement.
6. Batch manufacturer + unknown traceability need -> ask traceability question before vendor recommendation.
7. Multi-site manufacturer + unclear governance -> ask system-of-record question.
8. Public evidence suggests manufacturing but buyer facts conflict -> buyer fact controls and conflict is recorded.
9. Country vendor availability unverified -> category-level answer only.
10. Commercial partner has high commission but weaker fit -> commission must not change recommendation order.

P2/P3 must not be marked complete until these rules are represented in code/tests or an equivalent deterministic decision layer.