import { planFirstTouch } from './engine.js';
import { scoreIntent } from './scoring.js';
import type { Contact, Prospect, SendContext } from './types.js';

const prospect: Prospect = {
  id: 'DEMO-001',
  company: 'Demo Precision Manufacturing',
  domain: 'demo.invalid',
  country: 'US',
  timezone: 'America/Chicago',
  manufacturing: true,
  currentSystem: 'QuickBooks',
  suppressed: false,
  signals: [
    {
      type: 'QUICKBOOKS_TO_ERP',
      title: 'QuickBooks to ERP/MRP transition',
      description: 'Demo evidence for a current system-change project.',
      confidence: 0.95,
      eventAgeDays: 15,
      evidence: [{ url: 'https://demo.invalid/evidence', observedAt: '2026-08-15', grade: 'A' }],
    },
  ],
};

const contact: Contact = {
  id: 'DEMO-C-001',
  prospectId: prospect.id,
  title: 'Director of Operations',
  email: 'demo@demo.invalid',
  emailVerified: true,
  decisionRelevant: true,
  bouncedBefore: false,
  unsubscribed: false,
  complained: false,
  acquisitionFirstTouchSent: false,
};

const ctx: SendContext = {
  nowIso: new Date().toISOString(),
  localHour: 10,
  localWeekday: 2,
  jurisdiction: 'PASS',
  liveDomain: true,
  gmailSentDuplicate: false,
  crmDuplicate: false,
};

console.log(JSON.stringify({ intent: scoreIntent(prospect), actions: planFirstTouch({ prospect, contact, sendContext: ctx }) }, null, 2));
