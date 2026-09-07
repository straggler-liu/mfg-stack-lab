import type { IntentScore, Prospect, SignalType } from './types.js';

const SIGNAL_WEIGHTS: Record<SignalType, number> = {
  ERP_EVALUATION: 30,
  ERP_IMPLEMENTATION: 28,
  ERP_REPLACEMENT: 30,
  ERP_GO_LIVE: 30,
  QUICKBOOKS_TO_ERP: 35,
  XERO_TO_ERP: 35,
  EXCEL_TO_ERP: 35,
  MRP_HIRING: 24,
  SYSTEMS_TRANSFORMATION: 24,
  RFP_RFI: 35,
  NEW_FACILITY_SYSTEM_CHANGE: 24,
  INVENTORY_PLANNING_PAIN: 20,
  OTHER_VERIFIED: 12,
};

const GRADE_MULTIPLIER = { A: 1, B: 0.9, C: 0.72, D: 0.5, E: 0.25 } as const;

export function scoreIntent(prospect: Prospect): IntentScore {
  const reasons: string[] = [];
  if (!prospect.manufacturing || prospect.suppressed || prospect.signals.length === 0) {
    return { score: 0, tier: 'REJECT', reasons: ['fails_base_eligibility'] };
  }

  let raw = 10; // verified manufacturer baseline

  for (const signal of prospect.signals) {
    const bestEvidence = [...signal.evidence].sort(
      (a, b) => GRADE_MULTIPLIER[b.grade] - GRADE_MULTIPLIER[a.grade],
    )[0];
    const evidenceMultiplier = bestEvidence ? GRADE_MULTIPLIER[bestEvidence.grade] : 0.25;
    let freshness = 1;
    if (signal.eventAgeDays !== undefined) {
      if (signal.eventAgeDays <= 30) freshness = 1;
      else if (signal.eventAgeDays <= 90) freshness = 0.85;
      else if (signal.eventAgeDays <= 180) freshness = 0.55;
      else freshness = 0.25;
    }
    const contribution = SIGNAL_WEIGHTS[signal.type] * signal.confidence * evidenceMultiplier * freshness;
    raw += contribution;
    reasons.push(`${signal.type}:${Math.round(contribution)}`);
  }

  if (prospect.currentSystem) {
    raw += 8;
    reasons.push('current_system_known:+8');
  }

  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const tier = score >= 80 ? 'P0' : score >= 60 ? 'P1' : score >= 40 ? 'P2' : 'REJECT';
  return { score, tier, reasons };
}
