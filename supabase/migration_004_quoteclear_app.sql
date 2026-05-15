-- QuoteClear Milestone 2-4: app schema
-- All tables are service-role-only. Tenant filtering happens at the API
-- layer using the NextAuth session email.

-- 1. Contractor profiles — 1:1 with users by email
create table if not exists contractor_profiles (
  email text primary key references users(email) on delete cascade,
  company_name text,
  trade_type text,                                  -- roofer | hvac | plumber | electrician | painter | gc | other
  phone text,
  logo_url text,
  brand_color text default '#D4A574',
  address text,
  license_number text,
  qc_subscription_status text,                      -- active | trialing | past_due | canceled | null
  qc_stripe_customer_id text,
  qc_stripe_subscription_id text,
  qc_plan text,                                     -- starter | pro | scale
  qc_proposals_used_this_month int default 0,
  qc_billing_cycle_start timestamptz,
  created_at timestamptz default now()
);

-- 2. Proposals
create table if not exists qc_proposals (
  id uuid primary key default gen_random_uuid(),
  user_email text not null references users(email) on delete cascade,
  title text,
  customer_name text,
  customer_email text,
  customer_address text,
  trade_type text,
  raw_input text,
  ai_output_json jsonb,
  final_content jsonb,
  status text default 'draft',                      -- draft | sent | viewed | accepted | declined
  total_amount numeric(12,2),
  share_token uuid default gen_random_uuid() unique,
  viewed_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists qc_proposals_user_email_created_at_idx
  on qc_proposals (user_email, created_at desc);
create index if not exists qc_proposals_share_token_idx
  on qc_proposals (share_token);

-- 3. Line items
create table if not exists qc_proposal_line_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references qc_proposals(id) on delete cascade,
  description text,
  quantity numeric(12,3),
  unit_price numeric(12,2),
  total numeric(12,2),
  category text,                                    -- labor | materials | other
  is_optional boolean default false,
  sort_order int default 0
);
create index if not exists qc_proposal_line_items_proposal_id_idx
  on qc_proposal_line_items (proposal_id, sort_order);

-- 4. Templates
create table if not exists qc_templates (
  id uuid primary key default gen_random_uuid(),
  user_email text references users(email) on delete cascade,
  name text,
  trade_type text,
  content_json jsonb,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- 5. Change orders
create table if not exists qc_change_orders (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references qc_proposals(id) on delete cascade,
  description text,
  amount numeric(12,2),
  status text default 'pending',
  created_at timestamptz default now()
);

-- 6. Usage events (analytics + customer view tracking)
create table if not exists qc_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_email text references users(email) on delete cascade,
  event_type text,
  metadata_json jsonb,
  created_at timestamptz default now()
);

-- Enable RLS on every new table. Service-role bypasses RLS, so API routes
-- using getSupabaseAdmin() continue to work; anon/auth clients cannot read.
alter table contractor_profiles      enable row level security;
alter table qc_proposals             enable row level security;
alter table qc_proposal_line_items   enable row level security;
alter table qc_templates             enable row level security;
alter table qc_change_orders         enable row level security;
alter table qc_usage_events          enable row level security;
