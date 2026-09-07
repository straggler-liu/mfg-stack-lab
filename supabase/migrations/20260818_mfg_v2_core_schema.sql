begin;

create table public.mfg_decision_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null default 'decision-engine-v2',
  company_url text not null,
  normalized_domain text not null,
  current_system text,
  manufacturing_model text,
  primary_constraint text,
  decision_window text,
  status text not null default 'STARTED' check (status in ('STARTED','SCANNED','MAP_COMPLETED','QUALIFIED','COMMERCIAL_ACTION','CLOSED','ABANDONED')),
  qualified boolean not null default false,
  ip_hash text,
  user_agent_hash text,
  consent_version text,
  metadata jsonb not null default '{}'::jsonb
);

create index mfg_decision_sessions_created_at_idx on public.mfg_decision_sessions(created_at desc);
create index mfg_decision_sessions_domain_idx on public.mfg_decision_sessions(normalized_domain);
create index mfg_decision_sessions_status_idx on public.mfg_decision_sessions(status);

create table public.mfg_evidence_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.mfg_decision_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  source_url text not null,
  observed_at timestamptz not null default now(),
  evidence_kind text not null check (evidence_kind in ('FACT','INFERENCE')),
  field_name text not null,
  value_text text not null,
  excerpt text,
  confidence numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  content_hash text,
  metadata jsonb not null default '{}'::jsonb
);

create index mfg_evidence_items_session_idx on public.mfg_evidence_items(session_id);
create index mfg_evidence_items_source_idx on public.mfg_evidence_items(source_url);

create table public.mfg_decision_maps (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.mfg_decision_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  map_version text not null,
  recommended_path text not null,
  rationale text not null,
  risk_boundary text not null,
  representative_pilot text,
  missing_fact_question text,
  vendor_candidates jsonb not null default '[]'::jsonb,
  evidence_refs jsonb not null default '[]'::jsonb,
  confidence numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  metadata jsonb not null default '{}'::jsonb
);

create table public.mfg_commercial_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  session_id uuid references public.mfg_decision_sessions(id) on delete set null,
  event_name text not null check (event_name in (
    'LANDING_VIEW','URL_SUBMITTED','COMPANY_RESOLVED','PUBLIC_EVIDENCE_SCANNED','MAP_STARTED','MAP_COMPLETED',
    'QUALIFIED_INBOUND','SUBSTANTIVE_REPLY','QB_CREATED','DECISION_ARTIFACT_DELIVERED','VENDOR_FIT_SHOWN',
    'REFERRAL_CONSENT','REFERRAL_CLICK','PAID_CHECKOUT','PAID_PURCHASE','ATTRIBUTED_VENDOR_SUBSCRIPTION',
    'COMMISSION_ACCRUED','COMMISSION_SETTLED','CLOSED_ORDER'
  )),
  source text not null default 'web',
  idempotency_key text unique,
  amount numeric(14,2),
  currency text,
  vendor_slug text,
  external_ref text,
  metadata jsonb not null default '{}'::jsonb
);

create index mfg_commercial_events_time_idx on public.mfg_commercial_events(occurred_at desc);
create index mfg_commercial_events_session_idx on public.mfg_commercial_events(session_id);
create index mfg_commercial_events_name_idx on public.mfg_commercial_events(event_name);

create table public.mfg_referral_consents (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.mfg_decision_sessions(id) on delete cascade,
  vendor_slug text not null,
  consent_version text not null,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb,
  unique(session_id, vendor_slug, consent_version)
);

create table public.mfg_vendor_attribution (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.mfg_decision_sessions(id) on delete cascade,
  vendor_slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  tracking_url text,
  external_ref text,
  state text not null default 'FIT_SHOWN' check (state in ('FIT_SHOWN','CONSENTED','CLICKED','PURCHASED','COMMISSION_ACCRUED','COMMISSION_SETTLED')),
  purchase_amount numeric(14,2),
  commission_amount numeric(14,2),
  currency text,
  metadata jsonb not null default '{}'::jsonb
);

create index mfg_vendor_attribution_session_idx on public.mfg_vendor_attribution(session_id);
create index mfg_vendor_attribution_vendor_idx on public.mfg_vendor_attribution(vendor_slug);

create table public.mfg_rate_limits (
  key_hash text not null,
  route text not null,
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (key_hash, route, window_start)
);

create index mfg_rate_limits_updated_idx on public.mfg_rate_limits(updated_at desc);

alter table public.mfg_decision_sessions enable row level security;
alter table public.mfg_evidence_items enable row level security;
alter table public.mfg_decision_maps enable row level security;
alter table public.mfg_commercial_events enable row level security;
alter table public.mfg_referral_consents enable row level security;
alter table public.mfg_vendor_attribution enable row level security;
alter table public.mfg_rate_limits enable row level security;

revoke all on table public.mfg_decision_sessions from anon, authenticated;
revoke all on table public.mfg_evidence_items from anon, authenticated;
revoke all on table public.mfg_decision_maps from anon, authenticated;
revoke all on table public.mfg_commercial_events from anon, authenticated;
revoke all on table public.mfg_referral_consents from anon, authenticated;
revoke all on table public.mfg_vendor_attribution from anon, authenticated;
revoke all on table public.mfg_rate_limits from anon, authenticated;

grant all on table public.mfg_decision_sessions to service_role;
grant all on table public.mfg_evidence_items to service_role;
grant all on table public.mfg_decision_maps to service_role;
grant all on table public.mfg_commercial_events to service_role;
grant all on table public.mfg_referral_consents to service_role;
grant all on table public.mfg_vendor_attribution to service_role;
grant all on table public.mfg_rate_limits to service_role;

commit;
