import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSendGate, isClosedCommercialConversion, isQualifiedBuyer, transition } from '../src/policy.js';
import { planFirstTouch, planReply } from '../src/engine.js';
import type { Contact, FunnelRecord, Prospect, ReplyClassification, SendContext } from '../src/types.js';

const prospect: Prospect = {
  id: 'P-1',
  company: 'Example Manufacturing',
  domain: 'examplemfg.com',
  country: 'US',
  timezone: 'America/Los_Angeles',
  manufacturing: true,
  currentSystem: 'QuickBooks',
  suppressed: false,
  signals: [
    {
      type: 'QUICKBOOKS_TO_ERP',
      title: 'ERP transition role',
      description: 'Public role says the company is moving from QuickBooks to ERP/MRP.',
      confidence: 0.95,
      eventAgeDays: 12,
      evidence: [{ url: 'https://examplemfg.com/jobs/erp', observedAt: '2026-08-15', grade: 'A' }],
    },
  ],
};

const contact: Contact = {
  id: 'C-1',
  prospectId: 'P-1',
  name: 'Taylor',
  title: 'Director of Operations',
  email: 'taylor@examplemfg.com',
  emailVerified: true,
  decisionRelevant: true,
  bouncedBefore: false,
  unsubscribed: false,
  complained: false,
  acquisitionFirstTouchSent: false,
};

const sendContext: SendContext = {
  nowIso: '2026-08-15T17:00:00Z',
  localHour: 10,
  localWeekday: 5,
  jurisdiction: 'PASS',
  liveDomain: true,
  gmailSentDuplicate: false,
  crmDuplicate: false,
};

test('clean current-intent prospect passes send gate', () => {
  const result = evaluateSendGate(prospect, contact, sendContext);
  assert.equal(result.allowed, true);
  assert.deepEqual(result.reasons, []);
});

test('duplicate send is blocked', () => {
  const result = evaluateSendGate(prospect, contact, { ...sendContext, gmailSentDuplicate: true });
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.includes('gmail_sent_duplicate'));
});

test('prior bounce is suppressed', () => {
  const actions = planFirstTouch({
    prospect,
    contact: { ...contact, bouncedBefore: true },
    sendContext,
  });
  assert.equal(actions[0]?.type, 'SUPPRESS');
});

test('substantive buyer reply creates QB and free artifact', () => {
  const reply: ReplyClassification = {
    kind: 'SUBSTANTIVE_BUYER',
    substantive: true,
    decisionFacts: ['Current system is QuickBooks', 'Inventory accuracy is the hardest constraint'],
    nextBestAction: 'Send migration map',
    confidence: 0.98,
  };
  const actions = planReply({ prospect, contact, reply });
  assert.equal(actions[0]?.type, 'CREATE_QB');
  assert.equal(actions[1]?.type, 'DELIVER_FREE_ARTIFACT');
});

test('qualified buyer requires substantive interaction', () => {
  assert.equal(
    isQualifiedBuyer({
      prospect,
      identifiableBusinessContact: true,
      substantiveBuyerReply: false,
      liveDecisionTrigger: true,
    }),
    false,
  );
});

test('closed conversion excludes vague interest', () => {
  assert.equal(isClosedCommercialConversion({}), false);
  assert.equal(isClosedCommercialConversion({ buyerOrderedPaidMfgOffer: true }), true);
});

test('illegal funnel transition fails closed', () => {
  const record: FunnelRecord = {
    prospectId: 'P-1',
    stage: 'DISCOVERED',
    updatedAt: '2026-08-15T00:00:00Z',
    history: [{ stage: 'DISCOVERED', at: '2026-08-15T00:00:00Z' }],
  };
  assert.throws(() => transition(record, 'CLOSED_ORDER', '2026-08-15T01:00:00Z'));
});
