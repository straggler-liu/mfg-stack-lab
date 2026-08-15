import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPreValueSnapshot } from '../src/prevalue.js';
import type { Prospect } from '../src/types.js';

function prospect(signalType: Prospect['signals'][number]['type'], currentSystem?: string): Prospect {
  return {
    id: 'P-T',
    company: 'Test Manufacturing',
    domain: 'testmfg.example',
    country: 'US',
    manufacturing: true,
    currentSystem,
    suppressed: false,
    signals: [{
      type: signalType,
      title: 'Current ERP signal',
      description: 'Public role describes an active manufacturing systems project',
      confidence: 0.95,
      eventAgeDays: 20,
      evidence: [{ url: 'https://example.com/source', observedAt: '2026-08-15', grade: 'A' }],
    }],
  };
}

test('migration signal produces migration boundary value before ask', () => {
  const snapshot = buildPreValueSnapshot(prospect('QUICKBOOKS_TO_ERP', 'QuickBooks'));
  assert.equal(snapshot.recommendedArtifact, 'migration-boundary-map');
  assert.match(snapshot.decisionHypothesis, /operating boundary/i);
  assert.equal(snapshot.evidenceUrls.length, 1);
});

test('implementation signal does not pitch replacement', () => {
  const snapshot = buildPreValueSnapshot(prospect('ERP_IMPLEMENTATION', 'SYSPRO'));
  assert.equal(snapshot.recommendedArtifact, 'implementation-risk-map');
  assert.match(snapshot.decisionHypothesis, /implementation control/i);
  assert.doesNotMatch(snapshot.decisionHypothesis, /replace/i);
});

test('optimization signal focuses on workarounds and data', () => {
  const snapshot = buildPreValueSnapshot(prospect('SYSTEMS_TRANSFORMATION', 'SYSPRO'));
  assert.equal(snapshot.recommendedArtifact, 'erp-optimization-map');
  assert.match(snapshot.riskBoundary, /master data|manual workarounds/i);
});

test('no intent evidence fails closed', () => {
  const p = prospect('ERP_EVALUATION');
  p.signals = [];
  assert.throws(() => buildPreValueSnapshot(p));
});
