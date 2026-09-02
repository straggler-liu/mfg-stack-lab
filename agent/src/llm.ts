import OpenAI from 'openai';
import type { Contact, IntentScore, Prospect, ReplyClassification } from './types.js';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function model(): string {
  const value = process.env.OPENAI_MODEL;
  if (!value) throw new Error('OPENAI_MODEL is required');
  return value;
}

export interface OutreachDraft {
  subject: string;
  body: string;
  evidenceUsed: string[];
  ask: string;
}

export async function draftFirstTouch(input: {
  prospect: Prospect;
  contact: Contact;
  intent: IntentScore;
  offer: string;
}): Promise<OutreachDraft> {
  const response = await client.responses.create({
    model: model(),
    store: false,
    instructions: [
      'You write concise B2B manufacturing-software outreach.',
      'Use only facts present in the supplied prospect/contact/signal evidence.',
      'Never invent benchmarks, customers, outcomes, scarcity, urgency, savings or failure statistics.',
      'Reference one concrete live ERP/MRP signal, explain one relevant decision boundary, offer one free concrete artifact, and ask at most one simple question.',
      'No price, no meeting request, no generic praise, no hype.',
      'Subject <= 9 words. Body 35-80 words.',
    ].join(' '),
    input: JSON.stringify(input),
    text: {
      format: {
        type: 'json_schema',
        name: 'mfg_first_touch',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            subject: { type: 'string' },
            body: { type: 'string' },
            evidenceUsed: { type: 'array', items: { type: 'string' } },
            ask: { type: 'string' },
          },
          required: ['subject', 'body', 'evidenceUsed', 'ask'],
        },
      },
    },
  });

  return JSON.parse(response.output_text) as OutreachDraft;
}

export async function classifyReply(input: {
  prospect: Prospect;
  contact: Contact;
  originalSubject: string;
  originalBody: string;
  replyText: string;
}): Promise<ReplyClassification> {
  const response = await client.responses.create({
    model: model(),
    store: false,
    instructions: [
      'Classify an inbound response to manufacturing-software outreach.',
      'A substantive buyer reply contains a decision-relevant fact/question/request, current system, constraint, timeline, implementation detail, or acceptance/request for the offered free artifact.',
      'A substantive advisor reply contains a real client/project fact, useful question, or referral intent.',
      'OOO, DSN, generic acknowledgement, unsubscribe, complaint, vendor marketing and automated messages are not substantive.',
      'Extract only facts explicitly contained in the reply. Do not infer hidden intent.',
    ].join(' '),
    input: JSON.stringify(input),
    text: {
      format: {
        type: 'json_schema',
        name: 'mfg_reply_classification',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            kind: {
              type: 'string',
              enum: [
                'SUBSTANTIVE_BUYER',
                'SUBSTANTIVE_ADVISOR',
                'GENERIC_ACK',
                'OUT_OF_OFFICE',
                'DELIVERY_NOTICE',
                'UNSUBSCRIBE',
                'COMPLAINT',
                'VENDOR_MARKETING',
                'OTHER'
              ],
            },
            substantive: { type: 'boolean' },
            decisionFacts: { type: 'array', items: { type: 'string' } },
            nextBestAction: { type: 'string' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
          },
          required: ['kind', 'substantive', 'decisionFacts', 'nextBestAction', 'confidence'],
        },
      },
    },
  });

  return JSON.parse(response.output_text) as ReplyClassification;
}
