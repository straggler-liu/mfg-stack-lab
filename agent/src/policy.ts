import type { Contact, FunnelRecord, FunnelStage, Prospect, SendContext, SendGateResult } from './types.js';

const ALLOWED_TRANSITIONS: Record<FunnelStage, FunnelStage[]> = {
  DISCOVERED: ['VERIFIED', 'SUPPRESSED'],
  VERIFIED: ['QUEUED', 'SUPPRESSED'],
  QUEUED: ['CONTACTED', 'SUPPRESSED'],
  CONTACTED: ['REPLIED', 'SUPPRESSED'],
  REPLIED: ['QUALIFIED_BUYER', 'FREE_VALUE_DELIVERED', 'COMMERCIAL_ACTION', 'SUPPRESSED'],
  QUALIFIED_BUYER: ['FREE_VALUE_DELIVERED', 'COMMERCIAL_ACTION', 'SUPPRESSED'],
  FREE_VALUE_DELIVERED: ['COMMERCIAL_ACTION', 'CLOSED_ORDER', 'SUPPRESSED'],
  COMMERCIAL_ACTION: ['CLOSED_ORDER', 'SUPPRESSED'],
  CLOSED_ORDER: ['REVENUE_RECEIVED'],
  REVENUE_RECEIVED: [],
  SUPPRESSED: [],
};

export function evaluateSendGate(
  prospect: Prospect,
  contact: Contact,
  ctx: SendContext,
): SendGateResult {
  const reasons: string[] = [];

  if (!prospect.manufacturing) reasons.push('not_manufacturing');
  if (prospect.suppressed) reasons.push(`prospect_suppressed:${prospect.suppressionReason ?? 'unspecified'}`);
  if (prospect.signals.length === 0) reasons.push('no_current_intent_signal');
  if (!contact.emailVerified) reasons.push('email_not_verified');
  if (!contact.decisionRelevant) reasons.push('contact_not_decision_relevant');
  if (contact.bouncedBefore) reasons.push('prior_bounce');
  if (contact.unsubscribed) reasons.push('unsubscribed');
  if (contact.complained) reasons.push('complaint');
  if (contact.acquisitionFirstTouchSent) reasons.push('contact_first_touch_already_sent');
  if (!ctx.liveDomain) reasons.push('domain_not_live');
  if (ctx.gmailSentDuplicate) reasons.push('gmail_sent_duplicate');
  if (ctx.crmDuplicate) reasons.push('crm_duplicate');
  if (ctx.jurisdiction !== 'PASS') reasons.push(`jurisdiction_${ctx.jurisdiction.toLowerCase()}`);

  if (ctx.localWeekday === undefined || ctx.localHour === undefined) {
    reasons.push('local_time_unknown');
  } else {
    if (ctx.localWeekday === 0 || ctx.localWeekday === 6) reasons.push('outside_business_day');
    if (ctx.localHour < 9 || ctx.localHour >= 16) reasons.push('outside_business_hours');
  }

  return { allowed: reasons.length === 0, reasons };
}

export function canTransition(from: FunnelStage, to: FunnelStage): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function transition(record: FunnelRecord, to: FunnelStage, at: string, evidence?: string): FunnelRecord {
  if (!canTransition(record.stage, to)) {
    throw new Error(`Illegal funnel transition ${record.stage} -> ${to}`);
  }
  return {
    ...record,
    stage: to,
    updatedAt: at,
    history: [...record.history, { stage: to, at, evidence }],
  };
}

export function isQualifiedBuyer(input: {
  prospect: Prospect;
  identifiableBusinessContact: boolean;
  substantiveBuyerReply: boolean;
  liveDecisionTrigger: boolean;
}): boolean {
  return (
    input.prospect.manufacturing &&
    input.identifiableBusinessContact &&
    input.substantiveBuyerReply &&
    input.liveDecisionTrigger
  );
}

export function isClosedCommercialConversion(input: {
  buyerOrderedPaidMfgOffer?: boolean;
  vendorAcceptedPaidQualifiedBuyerIntro?: boolean;
  attributablePaidVendorPurchaseCreatesCommission?: boolean;
}): boolean {
  return Boolean(
    input.buyerOrderedPaidMfgOffer ||
      input.vendorAcceptedPaidQualifiedBuyerIntro ||
      input.attributablePaidVendorPurchaseCreatesCommission,
  );
}
