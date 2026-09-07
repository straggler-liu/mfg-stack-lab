export type CountryCode = string;

export type SignalType =
  | 'ERP_EVALUATION'
  | 'ERP_IMPLEMENTATION'
  | 'ERP_REPLACEMENT'
  | 'ERP_GO_LIVE'
  | 'QUICKBOOKS_TO_ERP'
  | 'XERO_TO_ERP'
  | 'EXCEL_TO_ERP'
  | 'MRP_HIRING'
  | 'SYSTEMS_TRANSFORMATION'
  | 'RFP_RFI'
  | 'NEW_FACILITY_SYSTEM_CHANGE'
  | 'INVENTORY_PLANNING_PAIN'
  | 'OTHER_VERIFIED';

export type EvidenceGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export interface Evidence {
  url: string;
  observedAt: string;
  publishedAt?: string;
  grade: EvidenceGrade;
  excerpt?: string;
}

export interface IntentSignal {
  type: SignalType;
  title: string;
  description: string;
  evidence: Evidence[];
  confidence: number; // 0..1
  eventAgeDays?: number;
}

export interface Prospect {
  id: string;
  company: string;
  domain: string;
  country: CountryCode;
  timezone?: string;
  manufacturing: boolean;
  employeeBand?: string;
  currentSystem?: string;
  signals: IntentSignal[];
  suppressed: boolean;
  suppressionReason?: string;
}

export interface Contact {
  id: string;
  prospectId: string;
  name?: string;
  title?: string;
  email: string;
  emailVerified: boolean;
  decisionRelevant: boolean;
  sourceUrl?: string;
  timezone?: string;
  bouncedBefore: boolean;
  unsubscribed: boolean;
  complained: boolean;
  acquisitionFirstTouchSent: boolean;
}

export type JurisdictionStatus = 'PASS' | 'INBOUND_ONLY' | 'BLOCKED' | 'UNKNOWN';

export interface SendContext {
  nowIso: string;
  localHour?: number;
  localWeekday?: number; // 0 Sunday..6 Saturday
  jurisdiction: JurisdictionStatus;
  liveDomain: boolean;
  gmailSentDuplicate: boolean;
  crmDuplicate: boolean;
}

export interface SendGateResult {
  allowed: boolean;
  reasons: string[];
}

export interface IntentScore {
  score: number; // 0..100
  tier: 'P0' | 'P1' | 'P2' | 'REJECT';
  reasons: string[];
}

export type ReplyKind =
  | 'SUBSTANTIVE_BUYER'
  | 'SUBSTANTIVE_ADVISOR'
  | 'GENERIC_ACK'
  | 'OUT_OF_OFFICE'
  | 'DELIVERY_NOTICE'
  | 'UNSUBSCRIBE'
  | 'COMPLAINT'
  | 'VENDOR_MARKETING'
  | 'OTHER';

export interface ReplyClassification {
  kind: ReplyKind;
  substantive: boolean;
  decisionFacts: string[];
  nextBestAction: string;
  confidence: number;
}

export type FunnelStage =
  | 'DISCOVERED'
  | 'VERIFIED'
  | 'QUEUED'
  | 'CONTACTED'
  | 'REPLIED'
  | 'QUALIFIED_BUYER'
  | 'FREE_VALUE_DELIVERED'
  | 'COMMERCIAL_ACTION'
  | 'CLOSED_ORDER'
  | 'REVENUE_RECEIVED'
  | 'SUPPRESSED';

export interface FunnelRecord {
  prospectId: string;
  stage: FunnelStage;
  updatedAt: string;
  history: Array<{ stage: FunnelStage; at: string; evidence?: string }>;
}
