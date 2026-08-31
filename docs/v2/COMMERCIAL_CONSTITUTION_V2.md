# MFG Stack Lab — Commercial Constitution V2

**Status:** Approved for implementation
**Model:** Pull-Primary Hybrid Revenue Engine
**Effective for V2 work:** 2026-08-18

## 1. North Star

MFG Stack Lab is a manufacturing-software decision engine and revenue operator, not a software directory and not a generic sales agent.

The commercial chain is:

`High-intent discovery -> Company context -> Decision value -> Qualified Buyer -> Commercial action -> Closed Order -> Cash`

The system must optimize for real commercial conversion, not feature completion, send volume, opens, clicks or traffic in isolation.

## 2. Primary growth architecture

### Primary engine: Pull / inbound

Priority acquisition surfaces:

1. Search and AI-search discovery;
2. high-intent comparison / pricing / problem pages;
3. advisor referrals;
4. vendor ecosystem referrals;
5. direct entry to the self-serve Decision Engine.

The preferred entry experience is:

`Paste company URL -> Public evidence scan -> Ask 1-2 missing facts -> Initial Decision Map`

The user should see useful decision value before being asked for a sales call or paid commitment.

### Secondary engine: Controlled outbound bridge

Outbound is retained as a controlled validation and early-revenue bridge, not as the core moat.

Outbound must remain:

- current-intent only;
- decision-owner or clearly tagged routing cohort;
- value-first;
- compliant;
- separately measured;
- limited by deliverability evidence;
- independent from fit ranking.

The personal Gmail / ad-hoc free-tool stack must not become the permanent scale layer.

## 3. Buyer value proposition

MFG Stack Lab answers the decision boundary, not merely the vendor list.

Core questions include:

- stay on accounting/spreadsheets or change now?;
- inventory-first vs light MRP vs deeper ERP?;
- replace an existing ERP or fix implementation/process ownership first?;
- where should BOM, routing, planning, WIP, job costing, traceability and integrations live?;
- what is over-buying?;
- what implementation risk can invalidate an otherwise good software choice?

## 4. Product ladder

### Free Initial Decision Map

The free product is the primary trust and qualification layer.

It should provide:

- up to three viable paths;
- explicit fit/non-fit boundaries;
- up to five hard gates / risks;
- one concrete next-step workflow or pilot;
- clear evidence boundaries;
- no mandatory sales call.

### Buyer-paid decision product

The paid buyer product is secondary, not the first cold ask.

The current `$149 Deep Diagnostic` is not automatically removed or discounted. V2 pricing must be validated with real usage signals before a permanent price is frozen.

Price-change gate:

- at least 10 legitimate completed free maps; and
- at least 3-5 real upgrade / scope / price-intent signals.

Then test product tiers and willingness to pay. Do not assume `$49-$79` is optimal without evidence.

### Vendor referral commission

Recurring vendor commission is the preferred long-term monetization route when:

- the buyer is a genuine fit;
- the buyer consents;
- product/country eligibility passes;
- attribution mechanics are verified.

Money cannot change recommendation order.

### Seller-paid Qualified Buyer Introduction

Retained as an exception route, not a default monetization path.

Use only where:

- no better recurring referral route exists;
- buyer consent exists;
- seller explicitly accepts terms;
- the fee does not distort fit scoring;
- economics justify the one-time introduction.

## 5. Commercial priority order

1. Genuine buyer decision value;
2. recurring vendor commission when fit + consent exist;
3. buyer-paid deeper decision product;
4. exception seller-paid introduction;
5. implementation/migration services only after the above validates demand.

## 6. Fit neutrality constitution

Fit Score / recommendation ranking must be computed before commercial routing.

Commercial compensation must never:

- raise a vendor's fit score;
- change recommendation order;
- suppress a better non-commercial option;
- trigger buyer-data sharing without consent.

Identifiable buyer information can be shared only with explicit buyer consent and a valid commercial/registration route.

## 7. Revenue truth

A Closed Commercial Conversion exists only when one of the following is evidenced:

1. buyer explicitly orders a paid MFG Stack Lab offer;
2. vendor explicitly accepts a paid Qualified Buyer Introduction / referral under known terms;
3. buyer completes an attributable paid vendor subscription/purchase through an approved tracked route and commission entitlement is evidenced.

Not an order:

- page view;
- click;
- anonymous fit check;
- generic reply;
- meeting;
- demo request;
- free trial;
- partner approval alone.

`Accrued commission != received revenue`.

Received revenue requires payment / settlement evidence.

## 8. Product architecture principle

The moat is not a proprietary contact database.

Commodity layers may include:

- Apollo / alternative contact providers;
- public web / search;
- email infrastructure;
- payment / Merchant of Record;
- scheduling;
- analytics transport.

Self-developed core:

- manufacturing intent detection;
- evidence model;
- workflow intelligence;
- ERP/MRP boundary reasoning;
- Fit Engine;
- decision-map generation;
- commercial state machine;
- attribution and learning loop.

## 9. MFG Revenue Agent V2 role hierarchy

### Core / promoted modules

- Evidence Judge
- Manufacturing Context Engine
- Intent Scorer
- Fit Engine
- Missing-Facts Selector
- Initial Decision Map Generator
- QB Qualifier
- Commercial Router
- Partner Attribution Engine
- Revenue / Learning Loop

### Reframed module

Signal Hunter becomes:

- search-demand miner;
- current-intent market intelligence;
- inbound company enrichment;
- optional outbound prospect source.

### Secondary / controlled modules

- Contact Resolver
- Outreach Writer
- Sequencer

These are optional bridge components and must not be the sole path to revenue.

## 10. Content / distribution constitution

Content exists to route high-intent users into the Decision Engine.

Do not optimize for article count.

Initial cornerstone set should prioritize proprietary decision value:

1. QuickBooks -> inventory / MRP / ERP boundary;
2. Do I need MRP or ERP?;
3. MRP vs inventory management;
4. QuickBooks + manufacturing system boundary;
5. Katana vs inFlow vs MRPeasy decision map;
6. small-manufacturer ERP implementation risk;
7. job-shop software decision guide;
8. food / batch / traceability decision guide.

Every cornerstone asset should include at least one of:

- proprietary decision matrix;
- workflow test;
- explicit non-fit conditions;
- checklist/calculator;
- evidence-based comparison;
- direct Decision Engine entry.

No scaled low-value AI-content production.

## 11. Measurement hierarchy

Primary commercial metrics:

- Qualified Inbound;
- Substantive Reply;
- QB Yield;
- Decision Map Completion;
- Referral Consent;
- Paid Checkout / Purchase;
- Attributed Vendor Subscription;
- Commission Accrued;
- Commission Settled;
- Closed Order Rate;
- Revenue per 100 qualified sessions/prospects.

Secondary diagnostics:

- landing views;
- URL submissions;
- completion rate;
- search impressions;
- email deliveries;
- opens/clicks.

Diagnostics must not replace revenue truth.

## 12. 30 / 60 / 90 / 180 day gates

### Day 30 — Product Truth

Prove the URL-led intake can generate useful evidence-bounded Initial Decision Maps.

### Day 60 — Distribution Truth

Prove at least one repeatable acquisition source is producing meaningful sessions / maps: search, AI search, advisor, vendor referral or controlled outbound.

### Day 90 — Commercial Truth I

Require at least one meaningful downstream commercial signal such as qualified inbound, referral click/consent, paid intent or vendor commercial action.

### Day 180 — Commercial Truth II

If traffic has no growth, QBs remain approximately zero, referral/paid actions remain zero and no repeatable acquisition channel exists, trigger a formal Pivot / Shutdown Review.

Sunk cost is not a reason to continue.

## 13. Production change discipline

Every V2 production release requires:

1. rollback ref;
2. explicit event tracking;
3. Fit neutrality check;
4. consent/data-sharing check;
5. no degradation of existing high-intent pages;
6. measurable acceptance criteria;
7. post-release verification.

No stage may declare success solely because code or a page shipped.
