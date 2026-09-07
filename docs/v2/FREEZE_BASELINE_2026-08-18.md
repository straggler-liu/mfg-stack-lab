# MFG Stack Lab V2 — Freeze Baseline

**Freeze date:** 2026-08-18 (Asia/Shanghai)
**Production base commit:** `566a6bd5f2cc4f0789721d5f41b6a4735abf50d9`
**Rollback branch:** `freeze/pre-v2-2026-08-18`
**V2 work branch:** `v2/pull-primary-hybrid`

## 1. Purpose

This file freezes the known pre-V2 state before any production-facing changes. V2 changes must be made on the V2 work branch first and must remain reversible to the frozen baseline.

## 2. Frozen production behavior

Pre-V2 public site behavior is centered on:

- 90-sec Quick Fit;
- reviewed Full Fit / shortlist intake;
- pricing and comparison pages;
- advisor and vendor routes;
- buyer-free / vendor-supported introduction model;
- outbound-supported commercial validation.

The current production homepage is not yet a `Paste company URL -> immediate decision value` experience.

## 3. Frozen commercial truth

At the freeze checkpoint, the commercial funnel remains pre-revenue:

- Qualified Buyers: 0
- Substantive buyer replies: 0
- Advisor replies: 0
- Free Decision Artifact delivered to a real buyer: 0
- Vendor Opportunities: 0
- Closed Orders: 0
- Revenue received: USD 0
- Revenue accrued: USD 0

The clean decision-owner recovery cohort contains three delivered samples:

1. Newly Weds Foods
2. Doncasters
3. Cumberland Packaging Ltd

Routing-only contacts such as general company inboxes are tracked separately and do not count in the clean decision-owner denominator.

## 4. Frozen vendor monetization facts

### inFlow

Status: approved partner account.

Verified route:

`Buyer fit -> Buyer consent -> Partner.io tracked link -> Paid subscription -> 20% recurring commission entitlement`

Important boundaries:

- partner approval is not an order;
- referral link is used only for genuine inFlow-fit buyers after consent;
- recommendation order is independent of compensation;
- accrued commission and received revenue are different states.

### Katana

Status: partner call required. Do not consume human partner-call time before a genuine Katana-fit opportunity exists.

### MRPeasy

Status: blocked by registered-company / formal-invoicing requirement. Do not fabricate legal-entity eligibility.

## 5. Frozen infrastructure facts

### Gmail

Source of truth for actual sends, replies, DSNs and partner-commercial evidence.

### Growth Ops Sheet

Commercial system of record for Prospects, Outreach_Log, Leads, Fit_Profiles, Advisor_Pipeline, Vendor_Pipeline, Vendor_Opportunities, Revenue and Sprint_Daily.

### Apollo

Commodity contact/enrichment layer only. Current connected Free plan does not expose global people search API.

### Make

The Free plan warning received 2026-08-17 indicates 75% of available credits used. This is a warning, not evidence of exhaustion or scenario suspension. Make must not become a single point of failure.

### Revenue Agent

Current automation: `MFG Revenue Agent — Value-First Pilot`.

Pre-V2 emphasis: current-intent discovery, contact resolution, value-first outreach, reply/QB/close tracking.

## 6. Rollback rule

If any V2 production change causes a material regression in:

- availability;
- intake completion;
- analytics integrity;
- consent handling;
- deliverability;
- fit neutrality;
- partner attribution;
- or user trust,

rollback production to commit `566a6bd5f2cc4f0789721d5f41b6a4735abf50d9` / branch `freeze/pre-v2-2026-08-18` before further iteration.

## 7. V2 migration gate

No production-facing V2 change should merge until:

1. Commercial Constitution V2 is committed;
2. the intake state machine is explicit;
3. event/analytics schema is defined;
4. Fit neutrality and consent gates remain deterministic;
5. rollback path is verified;
6. no existing public decision asset is unintentionally removed.
