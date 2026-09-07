import type { Prospect, SignalType } from './types.js';

export interface PreValueSnapshot {
  verifiedFact: string;
  decisionHypothesis: string;
  riskBoundary: string;
  recommendedArtifact: 'migration-boundary-map' | 'implementation-risk-map' | '3-option-decision-map' | 'erp-optimization-map';
  missingFactQuestion: string;
  evidenceUrls: string[];
}

const MIGRATION_SIGNALS = new Set<SignalType>(['QUICKBOOKS_TO_ERP', 'XERO_TO_ERP', 'EXCEL_TO_ERP']);
const IMPLEMENTATION_SIGNALS = new Set<SignalType>(['ERP_IMPLEMENTATION', 'ERP_GO_LIVE']);
const SELECTION_SIGNALS = new Set<SignalType>(['ERP_EVALUATION', 'ERP_REPLACEMENT', 'RFP_RFI']);

function firstEvidenceUrl(prospect: Prospect): string[] {
  const urls: string[] = [];
  for (const signal of prospect.signals) {
    for (const evidence of signal.evidence) {
      if (evidence.url && !urls.includes(evidence.url)) urls.push(evidence.url);
    }
  }
  return urls.slice(0, 3);
}

export function buildPreValueSnapshot(prospect: Prospect): PreValueSnapshot {
  if (!prospect.manufacturing || prospect.signals.length === 0) {
    throw new Error('Pre-value snapshot requires a manufacturing prospect with verified intent signal evidence.');
  }

  const primary = prospect.signals[0]!;
  const types = new Set(prospect.signals.map((signal) => signal.type));
  const system = prospect.currentSystem ? ` Their public signal references ${prospect.currentSystem}.` : '';
  const verifiedFact = `${prospect.company} has a current manufacturing-software signal: ${primary.description}.${system}`;

  if ([...types].some((type) => MIGRATION_SIGNALS.has(type))) {
    return {
      verifiedFact,
      decisionHypothesis: 'The immediate decision is probably not “which ERP?” but where the operating boundary should move from accounting/spreadsheets into inventory, planning, work orders and actual-cost control.',
      riskBoundary: 'The main over-buy/under-buy risk is choosing system depth before confirming BOM/routing depth, planning needs and WIP/job-cost requirements.',
      recommendedArtifact: 'migration-boundary-map',
      missingFactQuestion: 'What is the first workflow that breaks today: materials/inventory, production planning, or actual job cost?',
      evidenceUrls: firstEvidenceUrl(prospect),
    };
  }

  if ([...types].some((type) => IMPLEMENTATION_SIGNALS.has(type))) {
    return {
      verifiedFact,
      decisionHypothesis: 'The highest-value question is likely implementation control rather than replacement: which manufacturing workflow must be proven end-to-end before broader rollout.',
      riskBoundary: 'The main risk is a nominal go-live that leaves material planning, master data, routings, WIP or costing dependent on manual workarounds.',
      recommendedArtifact: 'implementation-risk-map',
      missingFactQuestion: 'Which workflow is the hardest go-live gate: planning/materials, shop-floor execution, or costing/reporting?',
      evidenceUrls: firstEvidenceUrl(prospect),
    };
  }

  if ([...types].some((type) => SELECTION_SIGNALS.has(type))) {
    return {
      verifiedFact,
      decisionHypothesis: 'The useful first step is to separate must-have manufacturing controls from features that can remain in the accounting or adjacent system.',
      riskBoundary: 'The main selection risk is comparing vendors before freezing the few workflow gates that actually determine system depth and implementation scope.',
      recommendedArtifact: '3-option-decision-map',
      missingFactQuestion: 'What one requirement would eliminate a candidate fastest: planning, traceability, job costing, scheduling, or migration?',
      evidenceUrls: firstEvidenceUrl(prospect),
    };
  }

  return {
    verifiedFact,
    decisionHypothesis: 'The public signal suggests an ERP/MRP utilization or business-systems improvement problem rather than a generic software-shopping problem.',
    riskBoundary: 'The main risk is optimizing the application layer while master data, integrations, workflow ownership or manual workarounds remain unresolved.',
    recommendedArtifact: 'erp-optimization-map',
    missingFactQuestion: 'Which constraint is driving the project now: manual workarounds, data quality, integration, planning, or reporting?',
    evidenceUrls: firstEvidenceUrl(prospect),
  };
}
