# MFG Revenue Agent — Commercial Eval

## North-star rule
A feature is not complete because code runs. It is only commercially validated when it creates a measurable improvement in the path:

`verified live-intent prospect -> delivered touch -> substantive reply -> qualified buyer -> opportunity -> closed order -> cash`

No engineering milestone may be reported as commercial success unless it moves one of these downstream metrics.

## Paid-agent benchmark lessons
Commercial AI SDR/BDR products typically combine: signal/ICP selection, prospect research, contact data, personalization, deliverability infrastructure, multi-touch sequencing, reply handling, qualification and meeting routing. Their strongest published evidence is usually meetings and pipeline; closed revenue attribution exists in some case studies but is less common and is generally vendor/customer self-reported rather than independently audited.

Therefore MFG Revenue Agent will not optimize for emails sent, opens, clicks or meetings alone. Those are diagnostics. Primary outcome metrics are substantive replies, qualified buyers, accepted commercial actions, closed orders and received revenue.

## Eval hierarchy
### E0 Signal precision
Question: are we identifying companies with a real current software decision?
Metric: proportion of sampled prospects with independently verifiable <=90-day ERP/MRP trigger.
Fail: generic manufacturing fit presented as intent.

### E1 Contact/deliverability
Question: can the system reach the right person safely?
Metrics: verified business-contact rate, delivered rate, hard-bounce rate, complaint/unsubscribe rate.
Hard gate: hard bounce <3% at scale; zero complaints target. Legacy bad cohorts stay separated from recovery cohorts.

### E2 Substantive reply
Question: does the message create a real business conversation?
Metrics: substantive replies / clean delivered first-touch companies; positive reply reason by signal/role/offer.
Milestones: 10, 25, 50 clean delivered companies. At 10 with zero replies change one variable. At 25 with zero replies make second controlled change. At 50 with zero replies retire the combination.

### E3 Qualified buyer
Question: are replies from real buyers with a live decision?
Metric: QBs / substantive buyer replies and QBs / clean delivered companies.
A QB requires real manufacturer + identifiable business contact + live software decision/implementation trigger + substantive interaction/profile.

### E4 Commercial action
Question: does free value advance an actual buying action?
Metrics: vendor-demo/referral consent, paid diagnostic order CTA acceptance, paid seller-intro acceptance.
Do not count free artifact delivery, meeting, click or trial as a commercial conversion.

### E5 Closed order
Question: did the agent create a real transaction?
Counts only if: buyer explicitly orders paid MFG service; vendor explicitly accepts paid QB introduction/referral; or attributable paid vendor purchase through an approved tracked route creates evidenced commission entitlement.

### E6 Cash
Question: was money actually received?
Metric: settled/received revenue. Accrued commission is tracked separately.

## Feature acceptance rule
Every new module must declare before implementation:
1. the bottleneck it targets;
2. the downstream metric expected to move;
3. the baseline;
4. minimum sample size;
5. pass threshold;
6. fail/kill condition;
7. rollback path.

Examples:
- Signal Hunter passes only if it raises verified current-intent inventory/precision and downstream reply/QB yield, not because it finds more companies.
- Contact Resolver passes only if it raises verified decision-owner coverage while preserving bounce/complaint gates.
- Personalization passes only if reply/QB rate improves versus the frozen baseline on comparable prospects.
- Sequencer passes only if incremental follow-ups produce additional substantive replies without materially worsening unsubscribe/complaint/deliverability.
- Reply Agent passes only if classification agrees with adjudicated labels and reduces time-to-qualified-response without false-positive commercial actions.
- Decision Map Agent passes only if recipients take a next buying action at a higher rate than comparable replies without the artifact.

## Experimental discipline
Use frozen cohorts and controlled changes. Never tune multiple major variables after seeing a result and then claim causality. Record signal type, country, company type, recipient role, send window, subject, body, CTA, delivery outcome, reply class, QB status and commercial outcome.

The first substantive reply freezes the winning acquisition context and triggers 10 comparable replications. The first QB freezes the qualification path. The first closed order freezes the complete acquisition-to-monetization path and triggers 10 comparable replications.

## Development priority
Commercial bottleneck beats feature completeness. If a live-pilot step is failing, engineering time goes first to the module most likely to improve the next downstream conversion. If a manual process already produces the desired outcome, keep it manual until automation demonstrates equal or better commercial performance.
