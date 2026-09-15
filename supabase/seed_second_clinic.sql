-- Segunda clínica piloto: Veterinaria Del Valle. Idempotente.
-- Contraseña de todas las cuentas: piloto123

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '55555555-5555-4555-8555-555555555555',
    'authenticated', 'authenticated', 'sofia@petearth.local',
    crypt('piloto123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Dra. Sofía Herrera"}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '66666666-6666-4666-8666-666666666666',
    'authenticated', 'authenticated', 'marta@petearth.local',
    crypt('piloto123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Marta León"}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '77777777-7777-4777-8777-777777777777',
    'authenticated', 'authenticated', 'paola@petearth.local',
    crypt('piloto123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Paola Vega"}'::jsonb,
    now(), now(), '', '', '', ''
  )
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
values
  (
    '55555555-5555-4555-8555-555555555551',
    '55555555-5555-4555-8555-555555555555',
    'sofia@petearth.local',
    jsonb_build_object('sub', '55555555-5555-4555-8555-555555555555', 'email', 'sofia@petearth.local'),
    'email', now(), now(), now()
  ),
  (
    '66666666-6666-4666-8666-666666666661',
    '66666666-6666-4666-8666-666666666666',
    'marta@petearth.local',
    jsonb_build_object('sub', '66666666-6666-4666-8666-666666666666', 'email', 'marta@petearth.local'),
    'email', now(), now(), now()
  ),
  (
    '77777777-7777-4777-8777-777777777771',
    '77777777-7777-4777-8777-777777777777',
    'paola@petearth.local',
    jsonb_build_object('sub', '77777777-7777-4777-8777-777777777777', 'email', 'paola@petearth.local'),
    'email', now(), now(), now()
  )
on conflict (id) do nothing;

insert into public.profiles (id, full_name, is_platform_admin)
values
  ('55555555-5555-4555-8555-555555555555', 'Dra. Sofía Herrera', false),
  ('66666666-6666-4666-8666-666666666666', 'Marta León', false),
  ('77777777-7777-4777-8777-777777777777', 'Paola Vega', false)
on conflict (id) do update set
  full_name = excluded.full_name,
  is_platform_admin = false;

insert into public.organizations (id, name, slug, settings)
values (
  'a0000000-0000-4000-8000-000000000002',
  'Veterinaria Del Valle',
  'del-valle',
  '{"fiscal":{"rfc":"VVA010101AA3","razonSocial":"Veterinaria Del Valle SA de CV","regimen":"612","codigoPostal":"03100"}}'::jsonb
)
on conflict (id) do update set name = excluded.name, settings = excluded.settings;

insert into public.branches (id, organization_id, name, slug, address)
values (
  'b0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000002',
  'Del Valle',
  'del-valle',
  'Insurgentes Sur 1235, Del Valle, CDMX'
)
on conflict (id) do update set address = excluded.address, name = excluded.name;

insert into public.staff_memberships (user_id, organization_id, branch_id, role, status)
values
  ('55555555-5555-4555-8555-555555555555', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'vet', 'active'),
  ('66666666-6666-4666-8666-666666666666', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'reception', 'active')
on conflict (user_id, organization_id) do update set role = excluded.role, status = 'active', branch_id = excluded.branch_id;

insert into public.clients (id, organization_id, user_id, full_name, phone, email)
values (
  'c0000000-0000-4000-8000-000000000011',
  'a0000000-0000-4000-8000-000000000002',
  '77777777-7777-4777-8777-777777777777',
  'Paola Vega', '5552223344', 'paola@petearth.local'
)
on conflict (id) do update set full_name = excluded.full_name, user_id = excluded.user_id;

insert into public.patients (
  id, organization_id, client_id, name, species, breed, sex, neutered, birth_date, color, alerts
)
values (
  'd0000000-0000-4000-8000-000000000011',
  'a0000000-0000-4000-8000-000000000002',
  'c0000000-0000-4000-8000-000000000011',
  'Nube', 'cat', 'Siamés', 'female', true, current_date - interval '3 years', 'Crema',
  'No mezclar con Pet Earth Roma Norte'
)
on conflict (id) do update set name = excluded.name, alerts = excluded.alerts;

insert into public.catalog_items (id, organization_id, kind, name, sku, unit_price, stock, min_stock, is_active)
values
  ('e0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000002', 'service', 'Consulta general', 'VV-CON', 520, null, null, true),
  ('e0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000002', 'product', 'Vacuna triple felina', 'VV-TRF', 720, 8, 3, true)
on conflict (id) do update set unit_price = excluded.unit_price, stock = excluded.stock;

insert into public.appointments (
  id, organization_id, branch_id, client_id, patient_id, vet_id, starts_at, ends_at, status, reason
)
values (
  'f0000000-0000-4000-8000-000000000011',
  'a0000000-0000-4000-8000-000000000002',
  'b0000000-0000-4000-8000-000000000002',
  'c0000000-0000-4000-8000-000000000011',
  'd0000000-0000-4000-8000-000000000011',
  '55555555-5555-4555-8555-555555555555',
  (current_date + time '10:00') at time zone 'America/Mexico_City',
  (current_date + time '10:30') at time zone 'America/Mexico_City',
  'scheduled',
  'Control postoperatorio'
)
on conflict (id) do update set starts_at = excluded.starts_at, status = excluded.status, reason = excluded.reason;

insert into public.reminders (id, organization_id, client_id, patient_id, kind, title, due_on, status)
values (
  'bb000000-0000-4000-8000-000000000011',
  'a0000000-0000-4000-8000-000000000002',
  'c0000000-0000-4000-8000-000000000011',
  'd0000000-0000-4000-8000-000000000011',
  'followup', 'Revisión de herida — Nube', current_date, 'pending'
)
on conflict (id) do update set due_on = excluded.due_on, status = 'pending';

update public.organizations
set settings = coalesce(settings, '{}'::jsonb) || jsonb_build_object(
  'fiscal', jsonb_build_object(
    'rfc', 'PEA0101013A9',
    'razonSocial', 'Clínica Pet Earth SA de CV',
    'regimen', '612',
    'codigoPostal', '06700'
  )
)
where id = 'a0000000-0000-4000-8000-000000000001'
  and coalesce(settings->'fiscal'->>'rfc', '') = '';
