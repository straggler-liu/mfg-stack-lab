import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProspectsFromDocuments, extractSignals } from '../src/signal_hunter.js';
import { resolveDecisionContacts, roleScore } from '../src/contact_resolver.js';
import { calculateCommercialMetrics, evaluatePilotA } from '../src/commercial_eval.js';
import type { RevenueEvent } from '../src/adapters.js';
import type { Prospect } from '../src/types.js';

test('signal hunter rejects stale ERP signal outside 90-day pilot window', () => {
  const signals = extractSignals(
    {
      company: 'OldCo',
      domain: 'oldco.com',
      country: 'US',
      manufacturing: true,
      title: 'ERP implementation',
      text: 'Manufacturing company implementing ERP across production and inventory.',
      url: 'https://oldco.com/news',
      observedAt: '2026-08-15',
      publishedAt: '2026-01-01',
    },
    90,
  );
  assert.equal(signals.length, 0);
});

test('signal hunter deduplicates multiple live documents by company domain', () => {
  const prospects = buildProspectsFromDocuments([
    {
      company: 'LiveCo',
      domain: 'liveco.com',
      country: 'US',
      manufacturing: true,
      title: 'ERP Manager role',
      text: 'Hiring ERP Manager for manufacturing production planning, BOM, routing and MRP implementation.',
      url: 'https://liveco.com/jobs/erp',
      observedAt: '2026-08-15',
      publishedAt: '2026-08-01',
    },
    {
      company: 'LiveCo',
      domain: 'liveco.com',
      country: 'US',
      manufacturing: true,
      title: 'ERP rollout',
      text: 'ERP rollout supports manufacturing inventory and production planning.',
      url: 'https://liveco.com/news/erp',
      observedAt: '2026-08-15',
      publishedAt: '2026-08-05',
    },
  ]);
  assert.equal(prospects.length, 1);
  assert.ok(prospects[0]!.signals.length >= 2);
});

test('contact resolver prefers verified named decision owner and rejects generic inbox role', async () => {
  const prospect: Prospect = {
    id: 'P-LIVE',
    company: 'LiveCo',
    domain: 'liveco.com',
    country: 'US',
    manufacturing: true,
    signals: [{
      type: 'ERP_IMPLEMENTATION',
      title: 'ERP rollout',
      description: 'ERP implementation',
      confidence: 0.9,
      evidence: [{ url: 'https://liveco.com', observedAt: '2026-08-15', grade: 'A' }],
    }],
    suppressed: false,
  };

  const result = await resolveDecisionContacts({
    prospect,
    sources: [{
      name: 'official',
      async find() {
        return [
          { name: 'Alex Ops', title: 'Director of Operations', email: 'alex@liveco.com', source: 'official', confidence: 0.95 },
          { title: 'General Information', email: 'info@liveco.com', source: 'official', confidence: 1 },
        ];
      },
    }],
    verifier: { async verify(email) { return email === 'alex@liveco.com' ? 'verified' : 'verified'; } },
  });

  assert.equal(result.contacts.length, 1);
  assert.equal(result.contacts[0]!.email, 'alex@liveco.com');
  assert.ok(roleScore('Director of Operations') > roleScore('General Information'));
});

test('commercial eval forces controlled pivot at 10 clean delivered with zero substantive replies', () => {
  const events: RevenueEvent[] = Array.from({ length: 10 }, (_, index) => ({
    eventId: `E-${index}`,
    prospectId: `P-${index}`,
    type: 'EMAIL_SENT',
    occurredAt: '2026-08-15T00:00:00Z',
    metadata: { cleanCurrentIntent: true },
  }));
  const metrics = calculateCommercialMetrics(events);
  assert.equal(metrics.cleanDeliveredCompanies, 10);
  assert.equal(evaluatePilotA(metrics), 'PIVOT_ONE_VARIABLE');
});

test('commercial eval retires 50-company zero-reply combination', () => {
  const events: RevenueEvent[] = Array.from({ length: 50 }, (_, index) => ({
    eventId: `E-${index}`,
    prospectId: `P-${index}`,
    type: 'EMAIL_SENT',
    occurredAt: '2026-08-15T00:00:00Z',
    metadata: { cleanCurrentIntent: true },
  }));
  const metrics = calculateCommercialMetrics(events);
  assert.equal(evaluatePilotA(metrics), 'RETIRE_COMBINATION');
});

test('commercial eval passes reply gate at 50 delivered with two substantive replies', () => {
  const events: RevenueEvent[] = Array.from({ length: 50 }, (_, index) => ({
    eventId: `S-${index}`,
    prospectId: `P-${index}`,
    type: 'EMAIL_SENT',
    occurredAt: '2026-08-15T00:00:00Z',
    metadata: { cleanCurrentIntent: true },
  }));
  events.push(
    { eventId: 'R-1', prospectId: 'P-1', type: 'REPLY_CLASSIFIED', occurredAt: '2026-08-15T01:00:00Z', metadata: { substantive: true } },
    { eventId: 'R-2', prospectId: 'P-2', type: 'REPLY_CLASSIFIED', occurredAt: '2026-08-15T01:00:00Z', metadata: { substantive: true } },
  );
  const metrics = calculateCommercialMetrics(events);
  assert.equal(metrics.substantiveReplyRate, 0.04);
  assert.equal(evaluatePilotA(metrics), 'REPLY_GATE_PASS');
});
