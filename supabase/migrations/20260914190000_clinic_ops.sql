-- Oleadas 1–4: papel, stock, fiscales CFDI 4.0 y evidencias clínicas.

alter table public.catalog_items
  add column if not exists min_stock numeric(10, 2);

alter table public.clients
  add column if not exists rfc text,
  add column if not exists tax_zip text,
  add column if not exists uso_cfdi text not null default 'G03',
  add column if not exists fiscal_name text;

alter table public.invoices
  add column if not exists cfdi_status text not null default 'none',
  add column if not exists cfdi_uuid text,
  add column if not exists receptor_rfc text,
  add column if not exists receptor_name text,
  add column if not exists receptor_zip text,
  add column if not exists uso_cfdi text,
  add column if not exists cfdi_requested_at timestamptz;

alter table public.invoices
  drop constraint if exists invoices_cfdi_status_check;
alter table public.invoices
  add constraint invoices_cfdi_status_check
  check (cfdi_status in ('none', 'requested', 'stamped', 'error'));

create table if not exists public.clinical_media (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  visit_id uuid references public.visits (id) on delete set null,
  kind text not null default 'photo' check (kind in ('photo', 'study')),
  storage_path text not null,
  caption text,
  content_type text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_clinical_media_patient
  on public.clinical_media (patient_id, created_at desc);
create index if not exists idx_clinical_media_visit
  on public.clinical_media (visit_id, created_at desc);

alter table public.clinical_media enable row level security;

drop policy if exists "staff manage clinical media" on public.clinical_media;
create policy "staff manage clinical media" on public.clinical_media
  for all to authenticated
  using (public.is_staff_of_org(organization_id))
  with check (public.is_staff_of_org(organization_id));

drop policy if exists "tutor read clinical media" on public.clinical_media;
create policy "tutor read clinical media" on public.clinical_media
  for select to authenticated
  using (
    exists (
      select 1
      from public.clients c
      where c.id = (
        select p.client_id from public.patients p where p.id = patient_id
      )
      and c.user_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clinical-media',
  'clinical-media',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "staff read clinical-media" on storage.objects;
create policy "staff read clinical-media" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'clinical-media'
    and public.is_staff_of_org((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "staff write clinical-media" on storage.objects;
create policy "staff write clinical-media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'clinical-media'
    and public.is_staff_of_org((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "staff update clinical-media" on storage.objects;
create policy "staff update clinical-media" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'clinical-media'
    and public.is_staff_of_org((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "staff delete clinical-media" on storage.objects;
create policy "staff delete clinical-media" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'clinical-media'
    and public.is_staff_of_org((storage.foldername(name))[1]::uuid)
  );

update public.catalog_items
set min_stock = 4
where kind = 'product' and min_stock is null;
