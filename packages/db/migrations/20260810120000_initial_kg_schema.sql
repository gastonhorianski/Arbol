-- Migration: initial knowledge graph schema
-- UUID interno + DNI/CUIT unique nullable + aliases + relationships tipadas

create extension if not exists "pgcrypto";

create table public.persons (
  id uuid primary key default gen_random_uuid(),
  dni text,
  display_name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint persons_dni_unique unique (dni)
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  cuit text,
  display_name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_cuit_unique unique (cuit)
);

create table public.person_aliases (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.persons (id) on delete cascade,
  alias text not null,
  created_at timestamptz not null default now(),
  unique (person_id, alias)
);

create table public.company_aliases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  alias text not null,
  created_at timestamptz not null default now(),
  unique (company_id, alias)
);

create table public.subsidies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete restrict,
  amount_ars numeric(18, 2) not null check (amount_ars >= 0),
  program_name text,
  granted_on date,
  source_url text,
  source_document text,
  confidence numeric(3, 2) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  src_type text not null check (src_type in ('person', 'company', 'subsidy', 'office')),
  src_id uuid not null,
  dst_type text not null check (dst_type in ('person', 'company', 'subsidy', 'office')),
  dst_id uuid not null,
  rel_type text not null check (
    rel_type in (
      'FAMILY_OF',
      'OWNS',
      'DIRECTOR_OF',
      'PARTNER_OF',
      'HOLDS_OFFICE',
      'RECEIVED_SUBSIDY'
    )
  ),
  props jsonb not null default '{}'::jsonb,
  valid_from date,
  valid_to date,
  source_url text,
  source_document text,
  confidence numeric(3, 2) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relationships_not_self check (not (src_type = dst_type and src_id = dst_id))
);

create index relationships_src_idx on public.relationships (src_type, src_id);
create index relationships_dst_idx on public.relationships (dst_type, dst_id);
create index relationships_rel_type_idx on public.relationships (rel_type);
create index subsidies_company_idx on public.subsidies (company_id);

alter table public.persons enable row level security;
alter table public.companies enable row level security;
alter table public.person_aliases enable row level security;
alter table public.company_aliases enable row level security;
alter table public.subsidies enable row level security;
alter table public.relationships enable row level security;

-- Read-mostly público para MVP (anon puede leer). Escritura solo authenticated.
create policy "persons_select_public" on public.persons for select to anon, authenticated using (true);
create policy "companies_select_public" on public.companies for select to anon, authenticated using (true);
create policy "person_aliases_select_public" on public.person_aliases for select to anon, authenticated using (true);
create policy "company_aliases_select_public" on public.company_aliases for select to anon, authenticated using (true);
create policy "subsidies_select_public" on public.subsidies for select to anon, authenticated using (true);
create policy "relationships_select_public" on public.relationships for select to anon, authenticated using (true);

create policy "persons_write_auth" on public.persons for all to authenticated using (true) with check (true);
create policy "companies_write_auth" on public.companies for all to authenticated using (true) with check (true);
create policy "person_aliases_write_auth" on public.person_aliases for all to authenticated using (true) with check (true);
create policy "company_aliases_write_auth" on public.company_aliases for all to authenticated using (true) with check (true);
create policy "subsidies_write_auth" on public.subsidies for all to authenticated using (true) with check (true);
create policy "relationships_write_auth" on public.relationships for all to authenticated using (true) with check (true);
