-- Pet Earth: PIMS clínico multi-tenant (admin + portal del tutor)

create extension if not exists "pgcrypto" with schema extensions;

create type public.staff_role as enum ('owner', 'admin', 'vet', 'reception');
create type public.membership_status as enum ('active', 'inactive');
create type public.species as enum ('dog', 'cat', 'other');
create type public.sex as enum ('male', 'female', 'unknown');
create type public.appointment_status as enum (
  'scheduled',
  'confirmed',
  'waiting',
  'in_consult',
  'completed',
  'no_show',
  'cancelled'
);
create type public.visit_status as enum ('in_progress', 'completed');
create type public.catalog_kind as enum ('service', 'product');
create type public.invoice_status as enum ('estimate', 'open', 'paid', 'cancelled');
create type public.payment_method as enum ('cash', 'card', 'transfer');
create type public.reminder_kind as enum ('appointment', 'vaccine', 'followup', 'deworming');
create type public.reminder_status as enum ('pending', 'done', 'cancelled');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  slug text not null,
  address text,
  timezone text not null default 'America/Mexico_City',
  is_active boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  branch_id uuid references public.branches (id) on delete cascade,
  role public.staff_role not null default 'reception',
  status public.membership_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index clients_org_email_uidx
  on public.clients (organization_id, lower(email))
  where email is not null;
create unique index clients_org_user_uidx
  on public.clients (organization_id, user_id)
  where user_id is not null;

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  species public.species not null default 'dog',
  breed text,
  sex public.sex not null default 'unknown',
  neutered boolean not null default false,
  birth_date date,
  microchip text,
  color text,
  allergies text,
  alerts text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  recorded_at timestamptz not null default now(),
  weight_kg numeric(6, 2) not null check (weight_kg > 0),
  created_by uuid references auth.users (id) on delete set null
);

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind public.catalog_kind not null,
  name text not null,
  sku text,
  unit_price numeric(10, 2) not null default 0 check (unit_price >= 0),
  stock numeric(10, 2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  branch_id uuid not null references public.branches (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  patient_id uuid not null references public.patients (id) on delete restrict,
  vet_id uuid references auth.users (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'scheduled',
  reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  branch_id uuid not null references public.branches (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  client_id uuid not null references public.clients (id) on delete restrict,
  patient_id uuid not null references public.patients (id) on delete restrict,
  vet_id uuid references auth.users (id) on delete set null,
  status public.visit_status not null default 'in_progress',
  subjective text,
  objective text,
  assessment text,
  plan text,
  weight_kg numeric(6, 2),
  temperature_c numeric(4, 1),
  heart_rate integer,
  respiratory_rate integer,
  followup_at date,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.visit_lines (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits (id) on delete cascade,
  catalog_item_id uuid references public.catalog_items (id) on delete set null,
  kind public.catalog_kind not null,
  description text not null,
  quantity numeric(10, 2) not null default 1 check (quantity > 0),
  unit_price numeric(10, 2) not null default 0 check (unit_price >= 0),
  line_total numeric(10, 2) not null default 0 check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  branch_id uuid not null references public.branches (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  visit_id uuid unique references public.visits (id) on delete set null,
  status public.invoice_status not null default 'open',
  services_total numeric(10, 2) not null default 0,
  products_total numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  visit_line_id uuid references public.visit_lines (id) on delete set null,
  kind public.catalog_kind not null,
  description text not null,
  quantity numeric(10, 2) not null default 1,
  unit_price numeric(10, 2) not null default 0,
  line_total numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  method public.payment_method not null default 'cash',
  amount numeric(10, 2) not null check (amount > 0),
  paid_at timestamptz not null default now(),
  received_by uuid references auth.users (id) on delete set null
);

create table public.vaccine_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  visit_id uuid references public.visits (id) on delete set null,
  catalog_item_id uuid references public.catalog_items (id) on delete set null,
  name text not null,
  lot text,
  applied_on date not null default current_date,
  next_due date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  kind public.reminder_kind not null,
  title text not null,
  due_on date not null,
  status public.reminder_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index idx_patients_client on public.patients (client_id);
create index idx_appointments_branch_starts on public.appointments (branch_id, starts_at);
create index idx_appointments_patient on public.appointments (patient_id, starts_at desc);
create index idx_visits_patient on public.visits (patient_id, started_at desc);
create index idx_reminders_due on public.reminders (organization_id, status, due_on);
create index idx_vaccine_patient on public.vaccine_records (patient_id, applied_on desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger branches_updated_at before update on public.branches
  for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
create trigger patients_updated_at before update on public.patients
  for each row execute function public.set_updated_at();
create trigger catalog_items_updated_at before update on public.catalog_items
  for each row execute function public.set_updated_at();
create trigger appointments_updated_at before update on public.appointments
  for each row execute function public.set_updated_at();
create trigger visits_updated_at before update on public.visits
  for each row execute function public.set_updated_at();
create trigger invoices_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_staff_of_org(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_memberships sm
    where sm.user_id = auth.uid()
      and sm.organization_id = target_org_id
      and sm.status = 'active'
  );
$$;

create or replace function public.is_staff_of_branch(target_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_memberships sm
    join public.branches b on b.id = target_branch_id
    where sm.user_id = auth.uid()
      and sm.status = 'active'
      and sm.organization_id = b.organization_id
  );
$$;

create or replace function public.is_tutor_of_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.clients c
    where c.id = target_client_id
      and c.user_id = auth.uid()
  );
$$;

create or replace function public.recalc_invoice(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_services numeric(10, 2);
  v_products numeric(10, 2);
begin
  select
    coalesce(sum(line_total) filter (where kind = 'service'), 0),
    coalesce(sum(line_total) filter (where kind = 'product'), 0)
  into v_services, v_products
  from public.invoice_lines
  where invoice_id = p_invoice_id;

  update public.invoices
  set services_total = v_services,
      products_total = v_products,
      total = v_services + v_products
  where id = p_invoice_id;
end;
$$;

create or replace function public.pe_check_in_appointment(p_appointment_id uuid)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.appointments;
begin
  select * into v_row from public.appointments where id = p_appointment_id;
  if not found then
    raise exception 'Cita no encontrada';
  end if;
  if not public.is_staff_of_branch(v_row.branch_id) then
    raise exception 'Sin permiso';
  end if;
  if v_row.status in ('completed', 'cancelled', 'no_show') then
    raise exception 'La cita ya está cerrada';
  end if;

  update public.appointments
  set status = 'waiting'
  where id = p_appointment_id
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.pe_start_visit(p_appointment_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_apt public.appointments;
  v_visit_id uuid;
  v_invoice_id uuid;
  v_consult public.catalog_items;
begin
  select * into v_apt from public.appointments where id = p_appointment_id;
  if not found then
    raise exception 'Cita no encontrada';
  end if;
  if not public.is_staff_of_branch(v_apt.branch_id) then
    raise exception 'Sin permiso';
  end if;

  select id into v_visit_id from public.visits where appointment_id = p_appointment_id;
  if found then
    return v_visit_id;
  end if;

  insert into public.visits (
    organization_id, branch_id, appointment_id, client_id, patient_id, vet_id, status
  ) values (
    v_apt.organization_id, v_apt.branch_id, v_apt.id, v_apt.client_id, v_apt.patient_id,
    coalesce(auth.uid(), v_apt.vet_id), 'in_progress'
  ) returning id into v_visit_id;

  insert into public.invoices (
    organization_id, branch_id, client_id, visit_id, status
  ) values (
    v_apt.organization_id, v_apt.branch_id, v_apt.client_id, v_visit_id, 'open'
  ) returning id into v_invoice_id;

  select * into v_consult
  from public.catalog_items
  where organization_id = v_apt.organization_id
    and kind = 'service'
    and is_active = true
    and name ilike 'Consulta general'
  order by created_at
  limit 1;

  if found then
    perform public.pe_add_visit_line(v_visit_id, v_consult.id, 1, v_consult.unit_price, v_consult.name);
  end if;

  update public.appointments
  set status = 'in_consult'
  where id = p_appointment_id;

  return v_visit_id;
end;
$$;

create or replace function public.pe_add_visit_line(
  p_visit_id uuid,
  p_catalog_item_id uuid,
  p_quantity numeric,
  p_unit_price numeric,
  p_description text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_visit public.visits;
  v_item public.catalog_items;
  v_kind public.catalog_kind;
  v_desc text;
  v_price numeric(10, 2);
  v_qty numeric(10, 2);
  v_total numeric(10, 2);
  v_line_id uuid;
  v_invoice_id uuid;
begin
  select * into v_visit from public.visits where id = p_visit_id;
  if not found then
    raise exception 'Consulta no encontrada';
  end if;
  if v_visit.status <> 'in_progress' then
    raise exception 'La consulta ya está cerrada';
  end if;
  if not public.is_staff_of_branch(v_visit.branch_id) then
    raise exception 'Sin permiso';
  end if;

  v_qty := greatest(p_quantity, 0.01);
  v_price := coalesce(p_unit_price, 0);
  v_desc := nullif(trim(coalesce(p_description, '')), '');
  v_kind := 'service';

  if p_catalog_item_id is not null then
    select * into v_item from public.catalog_items where id = p_catalog_item_id;
    if not found then
      raise exception 'Ítem de catálogo no encontrado';
    end if;
    v_kind := v_item.kind;
    v_desc := coalesce(v_desc, v_item.name);
    if p_unit_price is null then
      v_price := v_item.unit_price;
    end if;
  end if;

  if v_desc is null then
    raise exception 'Falta la descripción del cargo';
  end if;

  v_total := round(v_qty * v_price, 2);

  insert into public.visit_lines (visit_id, catalog_item_id, kind, description, quantity, unit_price, line_total)
  values (p_visit_id, p_catalog_item_id, v_kind, v_desc, v_qty, v_price, v_total)
  returning id into v_line_id;

  select id into v_invoice_id from public.invoices where visit_id = p_visit_id;
  if not found then
    insert into public.invoices (organization_id, branch_id, client_id, visit_id, status)
    values (v_visit.organization_id, v_visit.branch_id, v_visit.client_id, p_visit_id, 'open')
    returning id into v_invoice_id;
  end if;

  insert into public.invoice_lines (invoice_id, visit_line_id, kind, description, quantity, unit_price, line_total)
  values (v_invoice_id, v_line_id, v_kind, v_desc, v_qty, v_price, v_total);

  perform public.recalc_invoice(v_invoice_id);

  if v_kind = 'product' and p_catalog_item_id is not null then
    update public.catalog_items
    set stock = greatest(coalesce(stock, 0) - v_qty, 0)
    where id = p_catalog_item_id
      and stock is not null;
  end if;

  return v_line_id;
end;
$$;

create or replace function public.pe_apply_vaccine(
  p_visit_id uuid,
  p_catalog_item_id uuid,
  p_name text,
  p_lot text,
  p_next_due date,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_visit public.visits;
  v_item public.catalog_items;
  v_name text;
  v_record_id uuid;
begin
  select * into v_visit from public.visits where id = p_visit_id;
  if not found then
    raise exception 'Consulta no encontrada';
  end if;
  if not public.is_staff_of_branch(v_visit.branch_id) then
    raise exception 'Sin permiso';
  end if;

  v_name := nullif(trim(coalesce(p_name, '')), '');
  if p_catalog_item_id is not null then
    select * into v_item from public.catalog_items where id = p_catalog_item_id;
    if found then
      v_name := coalesce(v_name, v_item.name);
      perform public.pe_add_visit_line(p_visit_id, v_item.id, 1, v_item.unit_price, v_item.name);
    end if;
  end if;
  if v_name is null then
    raise exception 'Indica el nombre de la vacuna';
  end if;

  insert into public.vaccine_records (
    organization_id, patient_id, visit_id, catalog_item_id, name, lot, applied_on, next_due, notes
  ) values (
    v_visit.organization_id, v_visit.patient_id, p_visit_id, p_catalog_item_id,
    v_name, nullif(trim(coalesce(p_lot, '')), ''), current_date, p_next_due, p_notes
  ) returning id into v_record_id;

  if p_next_due is not null then
    insert into public.reminders (
      organization_id, client_id, patient_id, kind, title, due_on
    ) values (
      v_visit.organization_id, v_visit.client_id, v_visit.patient_id,
      'vaccine', 'Refuerzo: ' || v_name, p_next_due
    );
  end if;

  return v_record_id;
end;
$$;

create or replace function public.pe_complete_visit(
  p_visit_id uuid,
  p_subjective text,
  p_objective text,
  p_assessment text,
  p_plan text,
  p_weight_kg numeric,
  p_temperature_c numeric,
  p_heart_rate integer,
  p_respiratory_rate integer,
  p_followup_on date
)
returns public.visits
language plpgsql
security definer
set search_path = public
as $$
declare
  v_visit public.visits;
begin
  select * into v_visit from public.visits where id = p_visit_id;
  if not found then
    raise exception 'Consulta no encontrada';
  end if;
  if not public.is_staff_of_branch(v_visit.branch_id) then
    raise exception 'Sin permiso';
  end if;

  update public.visits
  set subjective = p_subjective,
      objective = p_objective,
      assessment = p_assessment,
      plan = p_plan,
      weight_kg = p_weight_kg,
      temperature_c = p_temperature_c,
      heart_rate = p_heart_rate,
      respiratory_rate = p_respiratory_rate,
      followup_at = p_followup_on,
      status = 'completed',
      completed_at = now()
  where id = p_visit_id
  returning * into v_visit;

  if p_weight_kg is not null then
    insert into public.weight_logs (patient_id, weight_kg, created_by)
    values (v_visit.patient_id, p_weight_kg, auth.uid());
  end if;

  if v_visit.appointment_id is not null then
    update public.appointments
    set status = 'completed'
    where id = v_visit.appointment_id;
  end if;

  if p_followup_on is not null then
    insert into public.reminders (
      organization_id, client_id, patient_id, appointment_id, kind, title, due_on
    ) values (
      v_visit.organization_id, v_visit.client_id, v_visit.patient_id, v_visit.appointment_id,
      'followup', 'Control post-consulta', p_followup_on
    );
  end if;

  return v_visit;
end;
$$;

create or replace function public.pe_pay_invoice(
  p_invoice_id uuid,
  p_method public.payment_method,
  p_amount numeric
)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.invoices;
begin
  select * into v_inv from public.invoices where id = p_invoice_id;
  if not found then
    raise exception 'Ticket no encontrado';
  end if;
  if not public.is_staff_of_branch(v_inv.branch_id) then
    raise exception 'Sin permiso';
  end if;
  if v_inv.status = 'paid' then
    raise exception 'El ticket ya está pagado';
  end if;
  if coalesce(p_amount, v_inv.total) <= 0 then
    raise exception 'Monto inválido';
  end if;

  insert into public.payments (invoice_id, method, amount, received_by)
  values (p_invoice_id, coalesce(p_method, 'cash'), coalesce(p_amount, v_inv.total), auth.uid());

  update public.invoices
  set status = 'paid'
  where id = p_invoice_id
  returning * into v_inv;

  return v_inv;
end;
$$;

grant execute on function public.pe_check_in_appointment(uuid) to authenticated;
grant execute on function public.pe_start_visit(uuid) to authenticated;
grant execute on function public.pe_add_visit_line(uuid, uuid, numeric, numeric, text) to authenticated;
grant execute on function public.pe_apply_vaccine(uuid, uuid, text, text, date, text) to authenticated;
grant execute on function public.pe_complete_visit(uuid, text, text, text, text, numeric, numeric, integer, integer, date) to authenticated;
grant execute on function public.pe_pay_invoice(uuid, public.payment_method, numeric) to authenticated;

alter table public.organizations enable row level security;
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.staff_memberships enable row level security;
alter table public.clients enable row level security;
alter table public.patients enable row level security;
alter table public.weight_logs enable row level security;
alter table public.catalog_items enable row level security;
alter table public.appointments enable row level security;
alter table public.visits enable row level security;
alter table public.visit_lines enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.payments enable row level security;
alter table public.vaccine_records enable row level security;
alter table public.reminders enable row level security;

create policy "staff read orgs" on public.organizations
  for select to authenticated using (public.is_staff_of_org(id));
create policy "staff manage orgs" on public.organizations
  for all to authenticated using (public.is_staff_of_org(id)) with check (public.is_staff_of_org(id));

create policy "staff read branches" on public.branches
  for select to authenticated using (public.is_staff_of_org(organization_id));
create policy "staff manage branches" on public.branches
  for all to authenticated using (public.is_staff_of_org(organization_id))
  with check (public.is_staff_of_org(organization_id));

create policy "users read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "users update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "staff read memberships" on public.staff_memberships
  for select to authenticated using (public.is_staff_of_org(organization_id) or user_id = auth.uid());

create policy "staff manage clients" on public.clients
  for all to authenticated
  using (public.is_staff_of_org(organization_id))
  with check (public.is_staff_of_org(organization_id));
create policy "tutor read own client" on public.clients
  for select to authenticated using (user_id = auth.uid());

create policy "staff manage patients" on public.patients
  for all to authenticated
  using (public.is_staff_of_org(organization_id))
  with check (public.is_staff_of_org(organization_id));
create policy "tutor read own patients" on public.patients
  for select to authenticated using (public.is_tutor_of_client(client_id));

create policy "staff manage weights" on public.weight_logs
  for all to authenticated
  using (
    exists (
      select 1 from public.patients p
      where p.id = patient_id and public.is_staff_of_org(p.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.patients p
      where p.id = patient_id and public.is_staff_of_org(p.organization_id)
    )
  );
create policy "tutor read weights" on public.weight_logs
  for select to authenticated
  using (
    exists (
      select 1 from public.patients p
      where p.id = patient_id and public.is_tutor_of_client(p.client_id)
    )
  );

create policy "staff manage catalog" on public.catalog_items
  for all to authenticated
  using (public.is_staff_of_org(organization_id))
  with check (public.is_staff_of_org(organization_id));

create policy "staff manage appointments" on public.appointments
  for all to authenticated
  using (public.is_staff_of_org(organization_id))
  with check (public.is_staff_of_org(organization_id));
create policy "tutor read appointments" on public.appointments
  for select to authenticated using (public.is_tutor_of_client(client_id));

create policy "staff manage visits" on public.visits
  for all to authenticated
  using (public.is_staff_of_org(organization_id))
  with check (public.is_staff_of_org(organization_id));
create policy "tutor read completed visits" on public.visits
  for select to authenticated
  using (public.is_tutor_of_client(client_id) and status = 'completed');

create policy "staff manage visit lines" on public.visit_lines
  for all to authenticated
  using (
    exists (
      select 1 from public.visits v
      where v.id = visit_id and public.is_staff_of_org(v.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.visits v
      where v.id = visit_id and public.is_staff_of_org(v.organization_id)
    )
  );
create policy "tutor read visit lines" on public.visit_lines
  for select to authenticated
  using (
    exists (
      select 1 from public.visits v
      where v.id = visit_id
        and v.status = 'completed'
        and public.is_tutor_of_client(v.client_id)
    )
  );

create policy "staff manage invoices" on public.invoices
  for all to authenticated
  using (public.is_staff_of_org(organization_id))
  with check (public.is_staff_of_org(organization_id));
create policy "staff manage invoice lines" on public.invoice_lines
  for all to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.is_staff_of_org(i.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.is_staff_of_org(i.organization_id)
    )
  );
create policy "staff manage payments" on public.payments
  for all to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.is_staff_of_org(i.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.is_staff_of_org(i.organization_id)
    )
  );

create policy "staff manage vaccines" on public.vaccine_records
  for all to authenticated
  using (public.is_staff_of_org(organization_id))
  with check (public.is_staff_of_org(organization_id));
create policy "tutor read vaccines" on public.vaccine_records
  for select to authenticated
  using (
    exists (
      select 1 from public.patients p
      where p.id = patient_id and public.is_tutor_of_client(p.client_id)
    )
  );

create policy "staff manage reminders" on public.reminders
  for all to authenticated
  using (public.is_staff_of_org(organization_id))
  with check (public.is_staff_of_org(organization_id));
create policy "tutor read reminders" on public.reminders
  for select to authenticated using (public.is_tutor_of_client(client_id));
