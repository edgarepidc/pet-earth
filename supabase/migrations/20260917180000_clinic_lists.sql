-- Dropdowns per clinic. Species leaves the rigid enum so each veterinaria can add its own.

create table if not exists public.clinic_lists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  list_key text not null check (list_key in ('species')),
  slug text not null,
  label text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, list_key, slug)
);

create index if not exists idx_clinic_lists_org_key
  on public.clinic_lists (organization_id, list_key, sort_order);

alter table public.clinic_lists enable row level security;

drop policy if exists "staff manage clinic lists" on public.clinic_lists;
create policy "staff manage clinic lists" on public.clinic_lists
  for all to authenticated
  using (public.is_staff_of_org(organization_id))
  with check (public.is_staff_of_org(organization_id));

drop policy if exists "tutor read clinic lists" on public.clinic_lists;
create policy "tutor read clinic lists" on public.clinic_lists
  for select to authenticated
  using (
    exists (
      select 1
      from public.clients c
      where c.organization_id = clinic_lists.organization_id
        and c.user_id = auth.uid()
    )
  );

alter table public.patients alter column species drop default;
alter table public.patients alter column species type text using species::text;
alter table public.patients alter column species set default 'dog';
alter table public.patients drop constraint if exists patients_species_not_blank;
alter table public.patients add constraint patients_species_not_blank check (length(trim(species)) > 0);

drop type if exists public.species;

insert into public.clinic_lists (organization_id, list_key, slug, label, sort_order)
select o.id, 'species', v.slug, v.label, v.sort_order
from public.organizations o
cross join (
  values
    ('dog', 'Perro', 10),
    ('cat', 'Gato', 20),
    ('other', 'Otra', 90)
) as v(slug, label, sort_order)
on conflict (organization_id, list_key, slug) do nothing;
