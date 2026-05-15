-- QuoteClear Milestone 1: demo widget rate-limit table
-- Tracks public landing-page demo usage by hashed IP. No PII stored.

create table if not exists qc_demo_usage (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  created_at timestamptz default now()
);

create index if not exists qc_demo_usage_ip_hash_created_at_idx
  on qc_demo_usage (ip_hash, created_at desc);

create index if not exists qc_demo_usage_created_at_idx
  on qc_demo_usage (created_at desc);

alter table qc_demo_usage enable row level security;

-- Service role only — no client reads or writes.
-- API route uses service-role key from lib/supabase.js (getSupabaseAdmin).
