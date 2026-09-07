import { createHash } from 'node:crypto';
import type { EvidenceGrade, IntentSignal, Prospect, SignalType } from './types.js';

export interface RawSignalDocument {
  company: string;
  domain: string;
  country: string;
  timezone?: string;
  manufacturing: boolean;
  title: string;
  text: string;
  url: string;
  observedAt: string;
  publishedAt?: string;
  evidenceGrade?: EvidenceGrade;
}

interface SignalRule {
  type: SignalType;
  confidence: number;
  test: (text: string) => boolean;
}

const rules: SignalRule[] = [
  {
    type: 'QUICKBOOKS_TO_ERP',
    confidence: 0.98,
    test: (t) => /quickbooks/i.test(t) && /(transition|migrat|move|replace|upgrade).{0,80}(erp|mrp)|(erp|mrp).{0,80}(quickbooks)/i.test(t),
  },
  {
    type: 'XERO_TO_ERP',
    confidence: 0.98,
    test: (t) => /xero/i.test(t) && /(transition|migrat|move|replace|upgrade).{0,80}(erp|mrp)|(erp|mrp).{0,80}(xero)/i.test(t),
  },
  {
    type: 'EXCEL_TO_ERP',
    confidence: 0.94,
    test: (t) => /(excel|spreadsheet)/i.test(t) && /(transition|migrat|replace|upgrade).{0,80}(erp|mrp)|(erp|mrp).{0,80}(excel|spreadsheet)/i.test(t),
  },
  {
    type: 'RFP_RFI',
    confidence: 0.99,
    test: (t) => /(request for proposal|request for information|\brfp\b|\brfi\b)/i.test(t) && /(erp|mrp|manufacturing system|business system)/i.test(t),
  },
  {
    type: 'ERP_GO_LIVE',
    confidence: 0.96,
    test: (t) => /(erp|mrp|dynamics|epicor|infor|oracle|sap|syspro)/i.test(t) && /(go[- ]live|golive|cutover|hypercare)/i.test(t),
  },
  {
    type: 'ERP_REPLACEMENT',
    confidence: 0.94,
    test: (t) => /(replace|replacement|migrat|moderni[sz]|transition)/i.test(t) && /(erp|mrp|dynamics|epicor|infor|oracle|sap|syspro)/i.test(t),
  },
  {
    type: 'ERP_EVALUATION',
    confidence: 0.92,
    test: (t) => /(evaluate|evaluation|select|selection|vendor review|software selection)/i.test(t) && /(erp|mrp|manufacturing software)/i.test(t),
  },
  {
    type: 'ERP_IMPLEMENTATION',
    confidence: 0.92,
    test: (t) => /(implement|implementation|deploy|rollout|roll-out)/i.test(t) && /(erp|mrp|dynamics|epicor|infor|oracle|sap|syspro)/i.test(t),
  },
  {
    type: 'MRP_HIRING',
    confidence: 0.88,
    test: (t) => /(hiring|job|role|vacancy|career|manager|analyst|lead)/i.test(t) && /(mrp|erp)/i.test(t) && /(manufactur|production|planning|bom|routing|work order)/i.test(t),
  },
  {
    type: 'SYSTEMS_TRANSFORMATION',
    confidence: 0.85,
    test: (t) => /(business systems|systems transformation|digital transformation|erp manager|enterprise applications)/i.test(t) && /(manufactur|production|supply chain|warehouse|inventory)/i.test(t),
  },
  {
    type: 'NEW_FACILITY_SYSTEM_CHANGE',
    confidence: 0.82,
    test: (t) => /(new plant|new facility|facility expansion|manufacturing expansion|new warehouse)/i.test(t) && /(erp|mrp|business system|production system)/i.test(t),
  },
  {
    type: 'INVENTORY_PLANNING_PAIN',
    confidence: 0.78,
    test: (t) => /(stockout|excess inventory|inventory accuracy|production planning|capacity planning|job costing|material planning)/i.test(t) && /(erp|mrp|system|software|process improvement)/i.test(t),
  },
];

function ageDays(publishedAt: string | undefined, observedAt: string): number | undefined {
  if (!publishedAt) return undefined;
  const published = Date.parse(publishedAt);
  const observed = Date.parse(observedAt);
  if (!Number.isFinite(published) || !Number.isFinite(observed)) return undefined;
  return Math.max(0, Math.floor((observed - published) / 86_400_000));
}

function prospectId(domain: string): string {
  const digest = createHash('sha256').update(domain.toLowerCase()).digest('hex').slice(0, 12);
  return `SIG-${digest}`;
}

export function extractSignals(doc: RawSignalDocument, maxEventAgeDays = 90): IntentSignal[] {
  const combined = `${doc.title}\n${doc.text}`;
  const age = ageDays(doc.publishedAt, doc.observedAt);
  if (age !== undefined && age > maxEventAgeDays) return [];

  return rules
    .filter((rule) => rule.test(combined))
    .map((rule) => ({
      type: rule.type,
      title: doc.title,
      description: doc.text.slice(0, 800),
      confidence: rule.confidence,
      eventAgeDays: age,
      evidence: [
        {
          url: doc.url,
          observedAt: doc.observedAt,
          publishedAt: doc.publishedAt,
          grade: doc.evidenceGrade ?? 'B',
          excerpt: doc.text.slice(0, 500),
        },
      ],
    }));
}

export function buildProspectsFromDocuments(
  documents: RawSignalDocument[],
  maxEventAgeDays = 90,
): Prospect[] {
  const grouped = new Map<string, Prospect>();

  for (const doc of documents) {
    if (!doc.manufacturing || !doc.domain) continue;
    const signals = extractSignals(doc, maxEventAgeDays);
    if (signals.length === 0) continue;

    const key = doc.domain.toLowerCase();
    const existing = grouped.get(key);
    if (existing) {
      existing.signals.push(...signals);
      continue;
    }

    grouped.set(key, {
      id: prospectId(key),
      company: doc.company,
      domain: key,
      country: doc.country,
      timezone: doc.timezone,
      manufacturing: true,
      signals,
      suppressed: false,
    });
  }

  return [...grouped.values()];
}
