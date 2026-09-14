-- Piloto Clínica Pet Earth (datos ficticios). Idempotente para db reset.

-- ---------------------------------------------------------------------------
-- Auth users (password: piloto123)
-- ---------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'vet@petearth.local',
    crypt('piloto123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Dra. Marina Solís"}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated', 'authenticated', 'recepcion@petearth.local',
    crypt('piloto123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Luis Ortega"}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-4333-8333-333333333333',
    'authenticated', 'authenticated', 'ana@petearth.local',
    crypt('piloto123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Ana Ruiz"}'::jsonb,
    now(), now(), '', '', '', ''
  )
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
values
  (
    '11111111-1111-4111-8111-111111111121',
    '11111111-1111-4111-8111-111111111111',
    'vet@petearth.local',
    jsonb_build_object('sub', '11111111-1111-4111-8111-111111111111', 'email', 'vet@petearth.local'),
    'email', now(), now(), now()
  ),
  (
    '22222222-2222-4222-8222-222222222221',
    '22222222-2222-4222-8222-222222222222',
    'recepcion@petearth.local',
    jsonb_build_object('sub', '22222222-2222-4222-8222-222222222222', 'email', 'recepcion@petearth.local'),
    'email', now(), now(), now()
  ),
  (
    '33333333-3333-4333-8333-333333333331',
    '33333333-3333-4333-8333-333333333333',
    'ana@petearth.local',
    jsonb_build_object('sub', '33333333-3333-4333-8333-333333333333', 'email', 'ana@petearth.local'),
    'email', now(), now(), now()
  )
on conflict (id) do nothing;

insert into public.profiles (id, full_name, is_platform_admin)
values
  ('11111111-1111-4111-8111-111111111111', 'Dra. Marina Solís', true),
  ('22222222-2222-4222-8222-222222222222', 'Luis Ortega', false),
  ('33333333-3333-4333-8333-333333333333', 'Ana Ruiz', false)
on conflict (id) do update set full_name = excluded.full_name;

-- ---------------------------------------------------------------------------
-- Clínica
-- ---------------------------------------------------------------------------
insert into public.organizations (id, name, slug)
values ('a0000000-0000-4000-8000-000000000001', 'Clínica Pet Earth', 'pet-earth')
on conflict (id) do update set name = excluded.name;

insert into public.branches (id, organization_id, name, slug, address)
values (
  'b0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'Roma Norte',
  'roma-norte',
  'Álvaro Obregón 210, Roma Norte, CDMX'
)
on conflict (id) do update set address = excluded.address;

insert into public.staff_memberships (user_id, organization_id, branch_id, role, status)
values
  ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'vet', 'active'),
  ('22222222-2222-4222-8222-222222222222', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'reception', 'active')
on conflict (user_id, organization_id) do update set role = excluded.role, status = 'active';

insert into public.clients (id, organization_id, user_id, full_name, phone, email)
values
  (
    'c0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    '33333333-3333-4333-8333-333333333333',
    'Ana Ruiz', '5551234567', 'ana@petearth.local'
  ),
  (
    'c0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    null,
    'Carlos Mendoza', '5559876543', 'carlos@petearth.local'
  )
on conflict (id) do update set full_name = excluded.full_name, user_id = excluded.user_id;

insert into public.patients (
  id, organization_id, client_id, name, species, breed, sex, neutered, birth_date, microchip, allergies, alerts
)
values
  (
    'd0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'Luna', 'dog', 'Golden retriever', 'female', true, '2022-03-12', '981000123456789',
    'Pollo', 'Ansiosa en mesa'
  ),
  (
    'd0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'Milo', 'cat', 'Doméstico pelo corto', 'male', true, '2023-07-01', null,
    null, 'Sale si se abre la jaula'
  ),
  (
    'd0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000002',
    'Rocky', 'dog', 'Mestizo', 'male', false, '2020-11-08', '981000987654321',
    null, null
  )
on conflict (id) do update set name = excluded.name, alerts = excluded.alerts;

insert into public.catalog_items (id, organization_id, kind, name, sku, unit_price, stock, is_active)
values
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'service', 'Consulta general', 'SRV-CON', 450, null, true),
  ('e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'service', 'Consulta de seguimiento', 'SRV-SEG', 280, null, true),
  ('e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'service', 'Aplicación de vacuna', 'SRV-VAC', 80, null, true),
  ('e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'product', 'Vacuna séxtuple', 'VAC-SEX', 650, 12, true),
  ('e0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'product', 'Vacuna antirrábica', 'VAC-RAB', 380, 18, true),
  ('e0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'product', 'Desparasitación', 'MED-DES', 220, 30, true),
  ('e0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001', 'product', 'Meloxicam 1.5 mg', 'MED-MEL', 185, 20, true)
on conflict (id) do update set unit_price = excluded.unit_price, stock = excluded.stock;

-- Agenda de hoy, mañana y la semana
insert into public.appointments (
  id, organization_id, branch_id, client_id, patient_id, vet_id, starts_at, ends_at, status, reason
)
values
  (
    'f0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    (current_date + time '09:30') at time zone 'America/Mexico_City',
    (current_date + time '10:00') at time zone 'America/Mexico_City',
    'scheduled',
    'Cojera pata trasera'
  ),
  (
    'f0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    (current_date + time '11:00') at time zone 'America/Mexico_City',
    (current_date + time '11:30') at time zone 'America/Mexico_City',
    'confirmed',
    'Vacuna anual'
  ),
  (
    'f0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000002',
    'd0000000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    (current_date + 1 + time '16:00') at time zone 'America/Mexico_City',
    (current_date + 1 + time '16:30') at time zone 'America/Mexico_City',
    'scheduled',
    'Control de piel'
  )
on conflict (id) do update set starts_at = excluded.starts_at, status = excluded.status, reason = excluded.reason;

insert into public.vaccine_records (
  id, organization_id, patient_id, name, lot, applied_on, next_due
)
values
  (
    'aa000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000001',
    'Vacuna séxtuple', 'LOT-A12', current_date - 340, current_date + 25
  ),
  (
    'aa000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000003',
    'Vacuna antirrábica', 'LOT-R9', current_date - 400, current_date - 5
  )
on conflict (id) do update set next_due = excluded.next_due;

insert into public.reminders (id, organization_id, client_id, patient_id, kind, title, due_on, status)
values
  (
    'bb000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000001',
    'vaccine', 'Refuerzo: Vacuna séxtuple', current_date + 25, 'pending'
  ),
  (
    'bb000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000002',
    'd0000000-0000-4000-8000-000000000003',
    'vaccine', 'Refuerzo: Vacuna antirrábica', current_date - 5, 'pending'
  ),
  (
    'bb000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000002',
    'deworming', 'Desparasitación de Milo', current_date + 3, 'pending'
  )
on conflict (id) do update set due_on = excluded.due_on, status = 'pending';

insert into public.weight_logs (patient_id, recorded_at, weight_kg)
values
  ('d0000000-0000-4000-8000-000000000001', now() - interval '90 days', 27.4),
  ('d0000000-0000-4000-8000-000000000001', now() - interval '30 days', 28.1),
  ('d0000000-0000-4000-8000-000000000002', now() - interval '40 days', 4.2);
