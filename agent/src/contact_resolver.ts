import { createHash } from 'node:crypto';
import type { Contact, Prospect } from './types.js';

export interface ContactCandidate {
  name?: string;
  title?: string;
  email?: string;
  sourceUrl?: string;
  source: string;
  confidence: number;
}

export interface CandidateSource {
  name: string;
  find(prospect: Prospect): Promise<ContactCandidate[]>;
}

export type VerificationStatus = 'verified' | 'unverified' | 'invalid' | 'unknown';

export interface EmailVerifier {
  verify(email: string): Promise<VerificationStatus>;
}

export interface ResolverResult {
  contacts: Contact[];
  candidatesExamined: number;
  namedDecisionOwnerFound: boolean;
  verifiedCoverage: number;
}

const roleRules: Array<{ pattern: RegExp; score: number }> = [
  { pattern: /chief operating officer|\bcoo\b/i, score: 100 },
  { pattern: /vp.{0,20}operations|vice president.{0,20}operations/i, score: 96 },
  { pattern: /director.{0,20}operations|head.{0,20}operations/i, score: 92 },
  { pattern: /erp manager|business systems manager|enterprise applications/i, score: 98 },
  { pattern: /it director|director.{0,20}it|information systems/i, score: 88 },
  { pattern: /supply chain director|director.{0,20}supply chain/i, score: 92 },
  { pattern: /supply chain manager/i, score: 84 },
  { pattern: /controller|chief financial officer|\bcfo\b/i, score: 82 },
  { pattern: /plant manager|manufacturing manager|operations manager/i, score: 78 },
];

export function roleScore(title?: string): number {
  if (!title) return 0;
  return roleRules.find((rule) => rule.pattern.test(title))?.score ?? 0;
}

function emailMatchesDomain(email: string, domain: string): boolean {
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  const emailDomain = parts[1];
  return emailDomain === domain.toLowerCase() || emailDomain.endsWith(`.${domain.toLowerCase()}`);
}

function contactId(prospectId: string, email: string): string {
  const digest = createHash('sha256')
    .update(`${prospectId}:${email.toLowerCase()}`)
    .digest('hex')
    .slice(0, 12);
  return `CON-${digest}`;
}

function candidateRank(candidate: ContactCandidate, prospect: Prospect): number {
  let score = roleScore(candidate.title);
  score += Math.round(candidate.confidence * 20);
  if (candidate.name) score += 8;
  if (candidate.email && emailMatchesDomain(candidate.email, prospect.domain)) score += 15;
  if (candidate.sourceUrl) score += 4;
  return score;
}

export async function resolveDecisionContacts(input: {
  prospect: Prospect;
  sources: CandidateSource[];
  verifier: EmailVerifier;
  limit?: number;
}): Promise<ResolverResult> {
  const limit = Math.max(1, Math.min(input.limit ?? 3, 3));
  const all: ContactCandidate[] = [];

  for (const source of input.sources) {
    const found = await source.find(input.prospect);
    all.push(...found);
  }

  const deduped = new Map<string, ContactCandidate>();
  for (const candidate of all) {
    if (!candidate.email) continue;
    const email = candidate.email.toLowerCase().trim();
    if (!emailMatchesDomain(email, input.prospect.domain)) continue;
    const previous = deduped.get(email);
    if (!previous || candidateRank(candidate, input.prospect) > candidateRank(previous, input.prospect)) {
      deduped.set(email, { ...candidate, email });
    }
  }

  const ranked = [...deduped.values()].sort(
    (a, b) => candidateRank(b, input.prospect) - candidateRank(a, input.prospect),
  );

  const contacts: Contact[] = [];
  for (const candidate of ranked) {
    if (contacts.length >= limit) break;
    if (!candidate.email || roleScore(candidate.title) === 0) continue;
    const status = await input.verifier.verify(candidate.email);
    if (status !== 'verified') continue;

    contacts.push({
      id: contactId(input.prospect.id, candidate.email),
      prospectId: input.prospect.id,
      name: candidate.name,
      title: candidate.title,
      email: candidate.email,
      emailVerified: true,
      decisionRelevant: true,
      sourceUrl: candidate.sourceUrl,
      timezone: input.prospect.timezone,
      bouncedBefore: false,
      unsubscribed: false,
      complained: false,
      acquisitionFirstTouchSent: false,
    });
  }

  return {
    contacts,
    candidatesExamined: all.length,
    namedDecisionOwnerFound: contacts.some((contact) => Boolean(contact.name)),
    verifiedCoverage: ranked.length > 0 ? contacts.length / Math.min(ranked.length, limit) : 0,
  };
}
