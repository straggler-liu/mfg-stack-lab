import type { Contact, FunnelRecord, Prospect, ReplyClassification } from './types.js';
import type { OutreachDraft } from './llm.js';

export interface SignalDiscoveryQuery {
  countries: string[];
  maxEventAgeDays: number;
  targetSignals: string[];
  limit: number;
}

export interface SignalSource {
  discover(query: SignalDiscoveryQuery): Promise<Prospect[]>;
}

export interface ContactResolver {
  findDecisionContacts(prospect: Prospect, limit: number): Promise<Contact[]>;
  verify(contact: Contact): Promise<Contact>;
}

export interface SentHistoryResult {
  recipientHit: boolean;
  domainHit: boolean;
  priorMessageIds: string[];
}

export interface InboundMessage {
  messageId: string;
  threadId: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  receivedAt: string;
}

export interface SendReceipt {
  messageId: string;
  threadId?: string;
  sentAt: string;
}

export interface Mailbox {
  checkSentHistory(email: string, domain: string): Promise<SentHistoryResult>;
  send(contact: Contact, draft: OutreachDraft): Promise<SendReceipt>;
  getNewInbound(sinceIso: string): Promise<InboundMessage[]>;
}

export interface RevenueEvent {
  eventId: string;
  prospectId: string;
  contactId?: string;
  type:
    | 'SIGNAL_FOUND'
    | 'CONTACT_VERIFIED'
    | 'SEND_QUEUED'
    | 'EMAIL_SENT'
    | 'EMAIL_BOUNCED'
    | 'REPLY_RECEIVED'
    | 'REPLY_CLASSIFIED'
    | 'QB_CREATED'
    | 'FREE_ARTIFACT_DELIVERED'
    | 'COMMERCIAL_ACTION'
    | 'CLOSED_ORDER'
    | 'REVENUE_RECEIVED'
    | 'SUPPRESSED'
    | 'CONTROL_INCIDENT';
  occurredAt: string;
  externalId?: string;
  evidence?: string;
  metadata?: Record<string, unknown>;
}

export interface CRM {
  upsertProspect(prospect: Prospect): Promise<void>;
  upsertContact(contact: Contact): Promise<void>;
  getFunnel(prospectId: string): Promise<FunnelRecord | null>;
  saveFunnel(record: FunnelRecord): Promise<void>;
  appendEvent(event: RevenueEvent): Promise<void>;
  hasEventByExternalId(externalId: string): Promise<boolean>;
}

export interface ReplyProcessor {
  classify(message: InboundMessage, prospect: Prospect, contact: Contact): Promise<ReplyClassification>;
}

export interface SchedulerLock {
  acquire(key: string, ttlSeconds: number): Promise<boolean>;
  release(key: string): Promise<void>;
}

export interface RevenueAgentRuntime {
  signals: SignalSource;
  contacts: ContactResolver;
  mailbox: Mailbox;
  crm: CRM;
  replies: ReplyProcessor;
  lock: SchedulerLock;
}
