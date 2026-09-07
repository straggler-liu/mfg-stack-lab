# MFG Revenue Agent

A manufacturing-software revenue agent built for MFG Stack Lab.

## Goal

The agent exists to move a real manufacturing software buyer through a measurable funnel:

`live intent signal -> verified contact -> compliant first touch -> substantive reply -> qualified buyer -> free decision artifact -> commercial action -> closed order -> received revenue`

The first production objective is not "send more email". It is to maximize **substantive replies per safe delivered contact**, while maintaining enough sample size to learn quickly.

## Why this is not a generic SDR bot

The agent must understand manufacturing-software decision boundaries: QuickBooks/Xero/Excel vs inventory-first software vs light MRP vs deeper MRP/ERP; BOM depth; planning; routing; scheduling; WIP; job costing; traceability; migration; implementation and go-live risks.

Fit decisions remain independent from vendor compensation.

## V0 modules

1. **Intent scoring** — deterministic scoring from dated, graded live signals.
2. **Send safety gate** — fails closed on duplicates, prior bounces, suppressions, unverified emails, unknown jurisdiction, or bad local timing.
3. **Funnel state machine** — prevents invalid jumps such as `DISCOVERED -> CLOSED_ORDER`.
4. **Structured outreach writer** — OpenAI Responses API with strict JSON Schema output; no fabricated facts, benchmarks, scarcity or outcomes.
5. **Structured reply classifier** — distinguishes substantive buyer/advisor replies from OOO, DSN, generic acknowledgement, unsubscribe, complaint and marketing.
6. **QB logic** — requires a real manufacturer, identifiable contact, live decision trigger and substantive buyer interaction.
7. **Commercial truth logic** — order only when an explicit paid buyer order, paid vendor introduction acceptance, or attributable paid vendor purchase creates commission entitlement.

## Safety constitution

- Gmail/SENT history is authoritative for send dedupe once the Gmail adapter is connected.
- One coherent company-level outreach plan; no simultaneous employee spam.
- Historical bounced recipients remain permanently suppressed.
- New verified recovery cohorts are measured separately so old bad data cannot permanently freeze safe new outreach.
- No unsolicited direct outreach where jurisdiction status is `UNKNOWN`, `INBOUND_ONLY` or `BLOCKED`.
- No synthetic/test addresses in production.
- No fabricated case studies, customer names, benchmarks, fear statistics, urgency or scarcity.
- Fit Score is calculated before and independently from commercial routing.
- Irreversible sends require all deterministic gates to pass.

## Current V0 state

Implemented:

- domain types
- intent scoring
- send gate
- funnel state machine
- QB and closed-conversion definitions
- first-touch planning
- reply planning
- free-artifact selection
- OpenAI structured outreach drafting
- OpenAI structured reply classification
- deterministic policy tests
- dry-run demo

Not yet connected in code:

- public-web signal ingestion
- Apollo contact adapter
- Gmail read/send adapter
- Growth Ops/CRM persistence adapter
- scheduler/worker runtime
- reply-thread continuation
- automatic Decision Map generation
- vendor partner routing
- metrics/eval dashboard

## Runtime design

Keep the architecture single-loop first:

`observe -> score -> gate -> act -> reconcile -> evaluate -> revise`

Do not begin with a swarm. Specialized sub-agents are only added where evidence shows a single-loop bottleneck.

### Planned adapters

```ts
interface SignalSource {
  discover(): Promise<Prospect[]>;
}

interface ContactResolver {
  resolve(prospect: Prospect): Promise<Contact[]>;
}

interface Mailbox {
  sentBefore(email: string, domain: string): Promise<boolean>;
  send(draft: OutreachDraft): Promise<{ messageId: string }>;
  getNewReplies(): Promise<InboundMessage[]>;
}

interface CRM {
  upsertProspect(prospect: Prospect): Promise<void>;
  recordEvent(event: RevenueEvent): Promise<void>;
}
```

## Production milestone gates

- **M0**: idempotent records + suppression + send safety working.
- **M1**: >=50 unique live-intent companies in inventory.
- **M2**: >=10 clean compliant current-intent sends. 0 replies -> change exactly one variable.
- **M3**: >=25 clean sends. 0 replies -> second controlled change + more advisor channel.
- **M4**: >=50 clean sends. 0 replies -> retire the combination.
- **M5**: >=10 high-fit advisor touches.
- **M6**: first substantive reply.
- **M7**: first Qualified Buyer.
- **M8**: first free decision artifact delivered.
- **M9**: first commercial action.
- **M10**: first genuine Closed Order.
- **M11**: first evidenced received revenue.

## Development

```bash
cd agent
npm install
npm test
npm run demo
```

For LLM-enabled functions set server-side environment variables:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=...
```

Never expose API keys in browser code or commit secrets to Git.
