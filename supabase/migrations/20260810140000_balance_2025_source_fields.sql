-- Mirror of applied remote migration: balance_2025_source_fields
alter table public.subsidies
  add column if not exists amount_verified boolean not null default false,
  add column if not exists source_label text;

alter table public.persons
  add column if not exists source_label text;

alter table public.companies
  add column if not exists source_label text;

create index if not exists companies_display_name_idx on public.companies (lower(display_name));
create index if not exists persons_display_name_idx on public.persons (lower(display_name));
