import type { RevenueEvent } from './adapters.js';

export interface CommercialMetrics {
  cleanSentCompanies: number;
  cleanDeliveredCompanies: number;
  hardBouncedCompanies: number;
  hardBounceRate: number;
  substantiveReplyCompanies: number;
  substantiveReplyRate: number;
  qualifiedBuyerCompanies: number;
  qbYield: number;
  commercialActionCompanies: number;
  buyingActionRate: number;
  closedOrderCompanies: number;
  closedOrderRate: number;
  revenueReceivedUsd: number;
  revenuePer100CleanProspects: number;
}

export type PilotDecision =
  | 'CONTINUE_BUILD_SAMPLE'
  | 'PIVOT_ONE_VARIABLE'
  | 'PIVOT_SECOND_VARIABLE_AND_ADVISOR'
  | 'RETIRE_COMBINATION'
  | 'REPLY_GATE_PASS'
  | 'DELIVERABILITY_PAUSE';

function uniqueProspects(events: RevenueEvent[], predicate: (event: RevenueEvent) => boolean): Set<string> {
  return new Set(events.filter(predicate).map((event) => event.prospectId));
}

function metadataBoolean(event: RevenueEvent, key: string): boolean {
  return event.metadata?.[key] === true;
}

function metadataNumber(event: RevenueEvent, key: string): number {
  const value = event.metadata?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function calculateCommercialMetrics(events: RevenueEvent[]): CommercialMetrics {
  const cleanSent = uniqueProspects(
    events,
    (event) => event.type === 'EMAIL_SENT' && metadataBoolean(event, 'cleanCurrentIntent'),
  );
  const bounced = uniqueProspects(
    events,
    (event) => event.type === 'EMAIL_BOUNCED' && cleanSent.has(event.prospectId),
  );
  const delivered = new Set([...cleanSent].filter((id) => !bounced.has(id)));
  const substantiveReplies = uniqueProspects(
    events,
    (event) =>
      event.type === 'REPLY_CLASSIFIED' &&
      metadataBoolean(event, 'substantive') &&
      delivered.has(event.prospectId),
  );
  const qbs = uniqueProspects(events, (event) => event.type === 'QB_CREATED');
  const commercialActions = uniqueProspects(events, (event) => event.type === 'COMMERCIAL_ACTION');
  const orders = uniqueProspects(events, (event) => event.type === 'CLOSED_ORDER');
  const revenue = events
    .filter((event) => event.type === 'REVENUE_RECEIVED')
    .reduce((sum, event) => sum + metadataNumber(event, 'amountUsd'), 0);

  const ratio = (num: number, den: number): number => (den > 0 ? num / den : 0);
  const cleanDeliveredCompanies = delivered.size;

  return {
    cleanSentCompanies: cleanSent.size,
    cleanDeliveredCompanies,
    hardBouncedCompanies: bounced.size,
    hardBounceRate: ratio(bounced.size, cleanSent.size),
    substantiveReplyCompanies: substantiveReplies.size,
    substantiveReplyRate: ratio(substantiveReplies.size, cleanDeliveredCompanies),
    qualifiedBuyerCompanies: qbs.size,
    qbYield: ratio(qbs.size, cleanDeliveredCompanies),
    commercialActionCompanies: commercialActions.size,
    buyingActionRate: ratio(commercialActions.size, qbs.size),
    closedOrderCompanies: orders.size,
    closedOrderRate: ratio(orders.size, qbs.size),
    revenueReceivedUsd: revenue,
    revenuePer100CleanProspects:
      cleanDeliveredCompanies > 0 ? (revenue / cleanDeliveredCompanies) * 100 : 0,
  };
}

export function evaluatePilotA(metrics: CommercialMetrics): PilotDecision {
  if (metrics.cleanSentCompanies >= 5 && metrics.hardBounceRate >= 0.05) {
    return 'DELIVERABILITY_PAUSE';
  }

  if (metrics.cleanDeliveredCompanies >= 50) {
    if (metrics.substantiveReplyCompanies >= 2 && metrics.substantiveReplyRate >= 0.04) {
      return 'REPLY_GATE_PASS';
    }
    return 'RETIRE_COMBINATION';
  }

  if (metrics.cleanDeliveredCompanies >= 25 && metrics.substantiveReplyCompanies === 0) {
    return 'PIVOT_SECOND_VARIABLE_AND_ADVISOR';
  }

  if (metrics.cleanDeliveredCompanies >= 10 && metrics.substantiveReplyCompanies === 0) {
    return 'PIVOT_ONE_VARIABLE';
  }

  return 'CONTINUE_BUILD_SAMPLE';
}
