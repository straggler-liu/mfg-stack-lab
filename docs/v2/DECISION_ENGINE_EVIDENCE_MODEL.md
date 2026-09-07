# MFG Stack Lab V2 — Decision Engine Evidence Model

Status: **P2B/P3 design contract — not production claim**

## Objective

Convert a buyer's company context into a useful, evidence-bounded Initial Decision Map while asking the fewest possible missing-fact questions. The engine must never infer private ERP, accounting, inventory accuracy, budget, implementation readiness or buyer authority from a public website.

## Evidence classes

1. **Public fact** — directly observed on a public company page or other attributable public source. Store source URL, observation time, excerpt, field, and content hash where available.
2. **Buyer-supplied fact** — explicitly provided by the buyer in the Decision Engine. Store field, value, timestamp and session ID.
3. **Inference** — rule/model interpretation derived from facts. Must remain separately labeled and must never be promoted to fact.
4. **Unknown** — material decision variable for which neither public nor buyer-supplied evidence exists. Unknowns drive missing-fact questions.

## Decision boundaries

The first map should decide boundaries before vendors:

### A. Accounting-only vs inventory/manufacturing layer

Key evidence:
- current accounting system (QuickBooks, Xero, other)
- whether BOMs exist
- whether raw material/WIP/finished goods are tracked
- whether stock accuracy is materially unreliable
- whether purchasing/production planning occurs outside accounting

Do **not** recommend an MRP/ERP solely because the company manufactures products.

### B. Inventory system vs MRP

MRP pressure rises when multiple of the following are true:
- multi-level BOMs
- dependent material demand
- work orders/routings
- finite or capacity-constrained planning
- meaningful WIP
- purchase suggestions tied to production demand
- make-to-order or mixed-mode scheduling complexity

Inventory-layer fit rises when the problem is primarily stock visibility, purchasing, order fulfillment, light assemblies/kits, barcode/warehouse control or ecommerce synchronization without deep production planning.

### C. MRP vs broader ERP

ERP pressure rises when the buyer needs tightly unified multi-entity finance, project accounting, service, CRM, HR, complex intercompany, advanced global controls, or broad enterprise workflows beyond manufacturing/inventory.

MRP-first remains valid when manufacturing planning is the main constraint and accounting/CRM can remain in an existing system through supported integrations.

### D. Replace vs stabilize existing ERP

A company already on Epicor, Infor, Dynamics 365, NetSuite, SAP, SYSPRO or similar must not be pushed toward replacement merely because an implementation/recruiting signal exists.

Default question: is the active decision about **replacement, rollout, stabilization, integration, reporting, planning quality, data cleanup, user adoption or upgrade**?

Replacement should require explicit evidence that the existing platform cannot meet material requirements at acceptable cost/risk.

## Minimum missing-fact question policy

Ask only questions that can change the boundary or top-path recommendation. Target 1–2 questions after public scan; never ask more than 3 before producing useful value.

### Question priority 1 — current system boundary

If current stack is unknown:

> What system do you use today for accounting, inventory and production planning (for example QuickBooks/Xero + spreadsheets, a standalone inventory tool, or an ERP/MRP)?

### Question priority 2 — manufacturing complexity

If BOM/planning complexity is unknown:

> Which best describes production today: simple assembly/kitting, single-level BOM/work orders, or multi-level BOMs with material/capacity scheduling?

### Question priority 3 — primary failure mode

If the buyer's constraint is unknown:

> What is the one problem forcing a decision now: inventory accuracy, purchasing/material shortages, production scheduling/WIP, traceability/quality, job costing, ecommerce fulfillment, or broader ERP integration?

### Question priority 4 — implementation scope

For an existing ERP:

> Are you trying to replace the current ERP, or make the existing rollout work better (planning, data, integration, reporting or adoption)?

### Question priority 5 — decision window

Only when commercial/readiness routing depends on it:

> When do you need a decision or implementation path: <30 days, 30–90 days, 3–6 months, or later?

## Public evidence fields worth extracting

Priority fields:
- company name/domain
- manufacturing model clues: job shop, batch/process, discrete assembly, configure/make-to-order, distribution + light manufacturing
- product/process clues
- traceability/regulated-industry clues
- ecommerce channels
- public accounting/ERP/integration mentions
- multiple sites/locations only when explicitly public
- active implementation/migration/ERP hiring signals only when sourced from attributable current public evidence

Avoid pseudo-precision. A marketing page saying "advanced manufacturing" is not evidence of multi-level BOM complexity, inventory accuracy, ERP dissatisfaction or budget.

## Initial Decision Map output contract

Every free map should contain:

1. **What we know** — 3–6 attributed facts, clearly labeled public vs buyer-supplied.
2. **Decision boundary** — e.g. accounting + inventory layer, MRP-first, broader ERP, or stabilize-existing-system.
3. **Top path** — category/system approach before vendor ranking.
4. **Why** — concise causal rationale tied to facts.
5. **Non-fit boundary** — explicit conditions that would invalidate the top path.
6. **One missing fact** — the highest-value unresolved question, if any.
7. **Next action** — free shortlist/fit note, vendor route with consent, or paid Deep Diagnostic only when active decision uncertainty justifies it.

## Vendor scoring contract

Fit scoring occurs **before** commercial routing.

Minimum dimensions:
- manufacturing-model fit
- BOM/MRP depth
- planning/scheduling fit
- inventory/warehouse fit
- traceability/quality fit
- accounting integration fit
- ecommerce fit
- implementation complexity fit
- country/product availability
- current pricing/support evidence

Commercial relationship, commission level and partner status have zero weight in Fit Score.

If country eligibility is not verified, return a category-level decision framework rather than a vendor recommendation.

## Commercial routing rules

- Free Initial Decision Map first whenever feasible.
- Qualified Buyer requires a real company plus substantive decision context; anonymous traffic/URL submission alone is not QB.
- `$149 Deep Diagnostic` only for active <=90-day decision context with unresolved material uncertainty after free value.
- inFlow tracked referral route may be shown only after independent fit, current country/product eligibility verification, and buyer consent.
- Seller-paid introduction is exception routing, not default monetization.

## Failure behavior

Fail closed when:
- website scan did not complete;
- source is inaccessible or non-public;
- current vendor/country eligibility cannot be verified;
- material facts conflict;
- evidence is too weak to distinguish inventory vs MRP vs ERP;
- buyer asks for a recommendation outside supported evidence.

Return what is known, what is unknown, and the single next fact required. Never manufacture certainty.