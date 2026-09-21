-- Public catalog copy/photos, and the tutor's preferred sucursal.
alter table public.catalog_items
  add column if not exists description text,
  add column if not exists image_url text;

alter table public.clients
  add column if not exists preferred_branch_id uuid references public.branches (id) on delete set null;

create index if not exists clients_preferred_branch_idx
  on public.clients (preferred_branch_id);
