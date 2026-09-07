import { evaluateSendGate, isQualifiedBuyer } from './policy.js';
import { scoreIntent } from './scoring.js';
import type {
  Contact,
  Prospect,
  ReplyClassification,
  SendContext,
} from './types.js';

export type AgentAction =
  | { type: 'REJECT'; reason: string }
  | { type: 'RESEARCH_CONTACT'; reason: string }
  | { type: 'QUEUE_FOR_SEND'; priority: 'P0' | 'P1' | 'P2'; reasons: string[] }
  | { type: 'HOLD'; reasons: string[] }
  | { type: 'CREATE_QB'; reason: string }
  | { type: 'DELIVER_FREE_ARTIFACT'; artifact: string }
  | { type: 'SUPPRESS'; reason: string }
  | { type: 'FOLLOW_UP'; reason: string };

export function planFirstTouch(input: {
  prospect: Prospect;
  contact?: Contact;
  sendContext?: SendContext;
}): AgentAction[] {
  const intent = scoreIntent(input.prospect);

  if (intent.tier === 'REJECT') {
    return [{ type: 'REJECT', reason: intent.reasons.join(',') }];
  }

  if (!input.contact) {
    return [{ type: 'RESEARCH_CONTACT', reason: `intent_${intent.tier}_${intent.score}` }];
  }

  if (!input.sendContext) {
    return [{ type: 'HOLD', reasons: ['missing_send_context'] }];
  }

  const gate = evaluateSendGate(input.prospect, input.contact, input.sendContext);
  if (!gate.allowed) {
    if (
      gate.reasons.includes('unsubscribed') ||
      gate.reasons.includes('complaint') ||
      gate.reasons.includes('prior_bounce')
    ) {
      return [{ type: 'SUPPRESS', reason: gate.reasons.join(',') }];
    }
    return [{ type: 'HOLD', reasons: gate.reasons }];
  }

  return [{ type: 'QUEUE_FOR_SEND', priority: intent.tier, reasons: intent.reasons }];
}

export function planReply(input: {
  prospect: Prospect;
  contact: Contact;
  reply: ReplyClassification;
}): AgentAction[] {
  if (input.reply.kind === 'UNSUBSCRIBE' || input.reply.kind === 'COMPLAINT') {
    return [{ type: 'SUPPRESS', reason: input.reply.kind.toLowerCase() }];
  }

  if (!input.reply.substantive) {
    return [{ type: 'FOLLOW_UP', reason: input.reply.kind.toLowerCase() }];
  }

  const buyer = isQualifiedBuyer({
    prospect: input.prospect,
    identifiableBusinessContact: true,
    substantiveBuyerReply: input.reply.kind === 'SUBSTANTIVE_BUYER',
    liveDecisionTrigger: input.prospect.signals.length > 0,
  });

  if (buyer) {
    return [
      { type: 'CREATE_QB', reason: 'live_manufacturing_trigger_plus_substantive_buyer_reply' },
      { type: 'DELIVER_FREE_ARTIFACT', artifact: selectFreeArtifact(input.prospect) },
    ];
  }

  if (input.reply.kind === 'SUBSTANTIVE_ADVISOR') {
    return [{ type: 'FOLLOW_UP', reason: 'advance_advisor_project_or_referral' }];
  }

  return [{ type: 'FOLLOW_UP', reason: input.reply.nextBestAction }];
}

export function selectFreeArtifact(prospect: Prospect): string {
  const types = new Set(prospect.signals.map((s) => s.type));
  if (types.has('ERP_GO_LIVE') || types.has('ERP_IMPLEMENTATION')) {
    return 'implementation-risk-map';
  }
  if (types.has('ERP_REPLACEMENT') || types.has('ERP_EVALUATION') || types.has('RFP_RFI')) {
    return '3-option-decision-map';
  }
  if (types.has('QUICKBOOKS_TO_ERP') || types.has('XERO_TO_ERP') || types.has('EXCEL_TO_ERP')) {
    return 'migration-boundary-map';
  }
  return 'manufacturing-software-decision-map';
}
