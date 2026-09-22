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
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-8444-444444444444',
    'authenticated', 'authenticated', 'plataforma@petearth.local',
    crypt('piloto123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Super admin Pet Earth"}'::jsonb,
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
  ),
  (
    '44444444-4444-4444-8444-444444444441',
    '44444444-4444-4444-8444-444444444444',
    'plataforma@petearth.local',
    jsonb_build_object('sub', '44444444-4444-4444-8444-444444444444', 'email', 'plataforma@petearth.local'),
    'email', now(), now(), now()
  )
on conflict (id) do nothing;

insert into public.profiles (id, full_name, is_platform_admin)
values
  ('11111111-1111-4111-8111-111111111111', 'Dra. Marina Solís', false),
  ('22222222-2222-4222-8222-222222222222', 'Luis Ortega', false),
  ('33333333-3333-4333-8333-333333333333', 'Ana Ruiz', false),
  ('44444444-4444-4444-8444-444444444444', 'Super admin Pet Earth', true)
on conflict (id) do update set
  full_name = excluded.full_name,
  is_platform_admin = excluded.is_platform_admin;

-- ---------------------------------------------------------------------------
-- Clínica
-- ---------------------------------------------------------------------------
insert into public.organizations (id, name, slug)
values ('a0000000-0000-4000-8000-000000000001', 'Clínica Pet Earth', 'pet-earth')
on conflict (id) do update set name = excluded.name;

insert into public.branches (id, organization_id, name, slug, address, settings)
values
  (
    'b0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'Roma Norte',
    'roma-norte',
    'Álvaro Obregón 210, Roma Norte, CDMX',
    '{"hours":"Lunes a sábado · 9:00 a 19:00","open":"09:00","close":"19:00","days":[1,2,3,4,5,6],"image":"/catalog/srv-con.jpg"}'::jsonb
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'Condesa',
    'condesa',
    'Amsterdam 45, Condesa, CDMX',
    '{"hours":"Lunes a sábado · 10:00 a 20:00","open":"10:00","close":"20:00","days":[1,2,3,4,5,6],"image":"/catalog/branch-con.jpg"}'::jsonb
  )
on conflict (id) do update set address = excluded.address, settings = excluded.settings;

update public.branches
set
  address = 'Amsterdam 45, Condesa, CDMX',
  settings = '{"hours":"Lunes a sábado · 10:00 a 20:00","open":"10:00","close":"20:00","days":[1,2,3,4,5,6],"image":"/catalog/branch-con.jpg"}'::jsonb
where organization_id = 'a0000000-0000-4000-8000-000000000001'
  and slug = 'condesa';

insert into public.staff_memberships (user_id, organization_id, branch_id, role, status)
values
  ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'vet', 'active'),
  ('22222222-2222-4222-8222-222222222222', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'reception', 'active')
on conflict (user_id, organization_id) do update set role = excluded.role, status = 'active';

insert into public.clients (id, organization_id, user_id, full_name, phone, email, preferred_branch_id)
values
  (
    'c0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    '33333333-3333-4333-8333-333333333333',
    'Ana Ruiz', '5551234567', 'ana@petearth.local',
    'b0000000-0000-4000-8000-000000000001'
  ),
  (
    'c0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    null,
    'Carlos Mendoza', '5559876543', 'carlos@petearth.local',
    'b0000000-0000-4000-8000-000000000001'
  )
on conflict (id) do update set full_name = excluded.full_name, user_id = excluded.user_id, preferred_branch_id = excluded.preferred_branch_id;

update public.clients
set preferred_branch_id = (
  select id from public.branches
  where organization_id = 'a0000000-0000-4000-8000-000000000001' and slug = 'condesa'
  limit 1
)
where id = 'c0000000-0000-4000-8000-000000000002';

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
  ),
  (
    'd0000000-0000-4000-8000-000000000004',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000002',
    'Coco', 'other', 'Conejo holandés', 'male', false, '2024-02-14', null,
    null, 'Muerde si lo sujetan del lomo'
  ),
  (
    'd0000000-0000-4000-8000-000000000005',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'Kira', 'dog', 'Border collie', 'female', true, '2021-05-20', '981000555666777',
    'Carne de res', null
  )
on conflict (id) do update set name = excluded.name, species = excluded.species, breed = excluded.breed, alerts = excluded.alerts;

insert into public.catalog_items (id, organization_id, kind, name, sku, unit_price, stock, min_stock, is_active, description, image_url)
values
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'service', 'Consulta general', 'SRV-CON', 450, null, null, true, 'Primera visita o un problema nuevo: exploración, diagnóstico y plan.', '/catalog/srv-con.jpg'),
  ('e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'service', 'Consulta de seguimiento', 'SRV-SEG', 280, null, null, true, 'Revisión de un tratamiento, herida o post operatorio.', '/catalog/srv-seg.jpg'),
  ('e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'service', 'Aplicación de vacuna', 'SRV-VAC', 80, null, null, true, 'Aplicación en consulta, con registro en la cartilla.', '/catalog/srv-vac.jpg'),
  ('e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'product', 'Vacuna séxtuple', 'VAC-SEX', 650, 12, 8, true, 'Protección anual combinada, según calendario.', '/catalog/vac-sex.jpg'),
  ('e0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'product', 'Vacuna antirrábica', 'VAC-RAB', 380, 18, 8, true, 'Refuerzo antirrábico y registro de próxima dosis.', '/catalog/vac-rab.jpg'),
  ('e0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'product', 'Desparasitación', 'MED-DES', 220, 30, 8, true, 'Interna, dosificada por peso y especie.', '/catalog/med-des.jpg'),
  ('e0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001', 'product', 'Meloxicam 1.5 mg', 'MED-MEL', 185, 2, 8, true, 'Antiinflamatorio de uso en consulta, según indicación del veterinario.', '/catalog/med-mel.jpg'),
  ('e0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000001', 'product', 'Shampoo hipoalergénico', 'HYG-SHA', 280, 16, 6, true, 'Shampoo suave para baño en casa, según piel y especie.', '/catalog/prod-sha.jpg'),
  ('e0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000001', 'product', 'Premios dentales', 'HYG-TRE', 145, 24, 8, true, 'Premios para higiene dental entre consultas.', '/catalog/prod-treat.jpg'),
  ('e0000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-000000000001', 'product', 'Pasta dental enzimática', 'HYG-PAS', 120, 14, 6, true, 'Pasta enzimática para cepillado en casa.', '/catalog/prod-paste.jpg'),
  ('e0000000-0000-4000-8000-00000000000b', 'a0000000-0000-4000-8000-000000000001', 'product', 'Toallitas para patas', 'HYG-WIP', 95, 20, 8, true, 'Toallitas para patas y hocico después del paseo.', '/catalog/prod-wipe.jpg'),
  ('e0000000-0000-4000-8000-00000000000c', 'a0000000-0000-4000-8000-000000000001', 'product', 'Cepillo de cerdas', 'HYG-BRU', 210, 10, 4, true, 'Cepillo de cerdas para el pelaje entre visitas.', '/catalog/prod-brush.jpg')
on conflict (id) do update set
  unit_price = excluded.unit_price,
  stock = excluded.stock,
  min_stock = excluded.min_stock,
  description = excluded.description,
  image_url = excluded.image_url,
  name = excluded.name,
  sku = excluded.sku,
  is_active = excluded.is_active;

-- Piso de Hoy: se reancla al día local de México cada vez que se aplica el seed.
insert into public.appointments (
  id, organization_id, branch_id, client_id, patient_id, vet_id, starts_at, ends_at, status, reason
)
select
  slot.id,
  'a0000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001',
  slot.client_id,
  slot.patient_id,
  '11111111-1111-4111-8111-111111111111',
  timezone('America/Mexico_City', mx.d + slot.day_offset + slot.start_t),
  timezone('America/Mexico_City', mx.d + slot.day_offset + slot.end_t),
  slot.status,
  slot.reason
from (select (timezone('America/Mexico_City', now()))::date as d) mx
cross join (
  values
    (
      'f0000000-0000-4000-8000-000000000001'::uuid,
      'c0000000-0000-4000-8000-000000000001'::uuid,
      'd0000000-0000-4000-8000-000000000001'::uuid,
      0, time '16:00', time '16:30', 'scheduled'::public.appointment_status,
      'Cojera pata trasera'
    ),
    (
      'f0000000-0000-4000-8000-000000000002'::uuid,
      'c0000000-0000-4000-8000-000000000001'::uuid,
      'd0000000-0000-4000-8000-000000000002'::uuid,
      0, time '10:15', time '10:45', 'waiting'::public.appointment_status,
      'Vacuna anual'
    ),
    (
      'f0000000-0000-4000-8000-000000000003'::uuid,
      'c0000000-0000-4000-8000-000000000002'::uuid,
      'd0000000-0000-4000-8000-000000000003'::uuid,
      0, time '11:00', time '11:30', 'in_consult'::public.appointment_status,
      'Control de piel'
    ),
    (
      'f0000000-0000-4000-8000-000000000004'::uuid,
      'c0000000-0000-4000-8000-000000000002'::uuid,
      'd0000000-0000-4000-8000-000000000004'::uuid,
      0, time '08:00', time '08:20', 'no_show'::public.appointment_status,
      'Corte de uñas'
    ),
    (
      'f0000000-0000-4000-8000-000000000005'::uuid,
      'c0000000-0000-4000-8000-000000000001'::uuid,
      'd0000000-0000-4000-8000-000000000005'::uuid,
      0, time '08:30', time '09:00', 'completed'::public.appointment_status,
      'Control post operatorio'
    ),
    (
      'f0000000-0000-4000-8000-000000000006'::uuid,
      'c0000000-0000-4000-8000-000000000002'::uuid,
      'd0000000-0000-4000-8000-000000000003'::uuid,
      1, time '16:00', time '16:30', 'scheduled'::public.appointment_status,
      'Revisión de piel'
    ),
    (
      'f0000000-0000-4000-8000-000000000007'::uuid,
      'c0000000-0000-4000-8000-000000000001'::uuid,
      'd0000000-0000-4000-8000-000000000001'::uuid,
      2, time '09:00', time '09:30', 'confirmed'::public.appointment_status,
      'Vacuna anual'
    ),
    (
      'f0000000-0000-4000-8000-000000000008'::uuid,
      'c0000000-0000-4000-8000-000000000001'::uuid,
      'd0000000-0000-4000-8000-000000000002'::uuid,
      2, time '11:30', time '12:00', 'scheduled'::public.appointment_status,
      'Otitis'
    ),
    (
      'f0000000-0000-4000-8000-000000000009'::uuid,
      'c0000000-0000-4000-8000-000000000002'::uuid,
      'd0000000-0000-4000-8000-000000000003'::uuid,
      2, time '17:00', time '17:30', 'scheduled'::public.appointment_status,
      'Control de piel'
    ),
    (
      'f0000000-0000-4000-8000-00000000000a'::uuid,
      'c0000000-0000-4000-8000-000000000001'::uuid,
      'd0000000-0000-4000-8000-000000000005'::uuid,
      3, time '10:00', time '10:30', 'scheduled'::public.appointment_status,
      'Seguimiento post operatorio'
    ),
    (
      'f0000000-0000-4000-8000-00000000000b'::uuid,
      'c0000000-0000-4000-8000-000000000002'::uuid,
      'd0000000-0000-4000-8000-000000000004'::uuid,
      3, time '12:15', time '12:35', 'scheduled'::public.appointment_status,
      'Revisión general'
    ),
    (
      'f0000000-0000-4000-8000-00000000000c'::uuid,
      'c0000000-0000-4000-8000-000000000001'::uuid,
      'd0000000-0000-4000-8000-000000000001'::uuid,
      3, time '17:00', time '17:30', 'scheduled'::public.appointment_status,
      'Control de cojera'
    ),
    (
      'f0000000-0000-4000-8000-00000000000d'::uuid,
      'c0000000-0000-4000-8000-000000000001'::uuid,
      'd0000000-0000-4000-8000-000000000002'::uuid,
      4, time '09:30', time '10:00', 'scheduled'::public.appointment_status,
      'Desparasitación'
    ),
    (
      'f0000000-0000-4000-8000-00000000000e'::uuid,
      'c0000000-0000-4000-8000-000000000002'::uuid,
      'd0000000-0000-4000-8000-000000000003'::uuid,
      4, time '13:00', time '13:30', 'scheduled'::public.appointment_status,
      'Revisión de piel'
    ),
    (
      'f0000000-0000-4000-8000-00000000000f'::uuid,
      'c0000000-0000-4000-8000-000000000001'::uuid,
      'd0000000-0000-4000-8000-000000000005'::uuid,
      5, time '10:00', time '10:30', 'scheduled'::public.appointment_status,
      'Vacuna antirrábica'
    ),
    (
      'f0000000-0000-4000-8000-000000000010'::uuid,
      'c0000000-0000-4000-8000-000000000002'::uuid,
      'd0000000-0000-4000-8000-000000000004'::uuid,
      5, time '11:30', time '11:50', 'scheduled'::public.appointment_status,
      'Corte de uñas'
    )
) as slot(id, client_id, patient_id, day_offset, start_t, end_t, status, reason)
on conflict (id) do update
  set starts_at = excluded.starts_at,
      ends_at = excluded.ends_at,
      status = excluded.status,
      reason = excluded.reason,
      client_id = excluded.client_id,
      patient_id = excluded.patient_id;

insert into public.visits (
  id, organization_id, branch_id, appointment_id, client_id, patient_id, vet_id,
  status, subjective, objective, assessment, plan, weight_kg, temperature_c,
  started_at, completed_at
)
select
  slot.id,
  'a0000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001',
  slot.appointment_id,
  slot.client_id,
  slot.patient_id,
  '11111111-1111-4111-8111-111111111111',
  slot.status,
  slot.subjective,
  slot.objective,
  slot.assessment,
  slot.plan,
  slot.weight_kg,
  slot.temperature_c,
  timezone('America/Mexico_City', mx.d + slot.started_t),
  case
    when slot.completed_t is null then null
    else timezone('America/Mexico_City', mx.d + slot.completed_t)
  end
from (select (timezone('America/Mexico_City', now()))::date as d) mx
cross join (
  values
    (
      'ab000000-0000-4000-8000-000000000001'::uuid,
      'f0000000-0000-4000-8000-000000000003'::uuid,
      'c0000000-0000-4000-8000-000000000002'::uuid,
      'd0000000-0000-4000-8000-000000000003'::uuid,
      'in_progress'::public.visit_status,
      'Prurito intenso desde hace 4 días. Se rasca de noche.',
      'Placas eritematosas en dorso. Temperatura 38.6.',
      null,
      null,
      22.4::numeric,
      38.6::numeric,
      time '11:05',
      null::time
    ),
    (
      'ab000000-0000-4000-8000-000000000002'::uuid,
      'f0000000-0000-4000-8000-000000000005'::uuid,
      'c0000000-0000-4000-8000-000000000001'::uuid,
      'd0000000-0000-4000-8000-000000000005'::uuid,
      'completed'::public.visit_status,
      'Control a 10 días de ovariohisterectomía. Come y camina bien.',
      'Herida limpia, sin dehiscencia. Sutura en buen estado.',
      'Evolución post operatoria adecuada.',
      'Retiro de puntos. Alta médica. Cobro en caja.',
      18.2::numeric,
      38.4::numeric,
      time '08:35',
      time '09:05'
    )
) as slot(
  id, appointment_id, client_id, patient_id, status,
  subjective, objective, assessment, plan, weight_kg, temperature_c, started_t, completed_t
)
on conflict (id) do update
  set status = excluded.status,
      appointment_id = excluded.appointment_id,
      subjective = excluded.subjective,
      objective = excluded.objective,
      assessment = excluded.assessment,
      plan = excluded.plan,
      started_at = excluded.started_at,
      completed_at = excluded.completed_at;

insert into public.visit_lines (
  id, visit_id, catalog_item_id, kind, description, quantity, unit_price, line_total
)
values
  (
    'ac000000-0000-4000-8000-000000000001',
    'ab000000-0000-4000-8000-000000000002',
    'e0000000-0000-4000-8000-000000000002',
    'service', 'Consulta de seguimiento', 1, 280, 280
  )
on conflict (id) do update
  set description = excluded.description, unit_price = excluded.unit_price, line_total = excluded.line_total;

insert into public.invoices (
  id, organization_id, branch_id, client_id, visit_id, status, services_total, products_total, total
)
values
  (
    'ad000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'ab000000-0000-4000-8000-000000000002',
    'open', 280, 0, 280
  )
on conflict (id) do update
  set status = excluded.status,
      visit_id = excluded.visit_id,
      services_total = excluded.services_total,
      products_total = excluded.products_total,
      total = excluded.total;

insert into public.invoice_lines (
  id, invoice_id, visit_line_id, kind, description, quantity, unit_price, line_total
)
values
  (
    'ae000000-0000-4000-8000-000000000001',
    'ad000000-0000-4000-8000-000000000001',
    'ac000000-0000-4000-8000-000000000001',
    'service', 'Consulta de seguimiento', 1, 280, 280
  )
on conflict (id) do update
  set description = excluded.description, unit_price = excluded.unit_price, line_total = excluded.line_total;

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

insert into public.clinical_media (id, organization_id, patient_id, kind, storage_path, caption, content_type)
values
  (
    'aa000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000001',
    'study',
    'a0000000-0000-4000-8000-000000000001/d0000000-0000-4000-8000-000000000001/rx-cadera.png',
    'Radiografía de cadera',
    'image/png'
  ),
  (
    'aa000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000001',
    'study',
    'a0000000-0000-4000-8000-000000000001/d0000000-0000-4000-8000-000000000001/laboratorio.png',
    'Laboratorio de control',
    'image/png'
  ),
  (
    'aa000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000002',
    'photo',
    'a0000000-0000-4000-8000-000000000001/d0000000-0000-4000-8000-000000000002/lesion.png',
    'Foto de lesión en consulta',
    'image/png'
  )
on conflict (id) do update set caption = excluded.caption, storage_path = excluded.storage_path;

insert into public.weight_logs (patient_id, recorded_at, weight_kg)
values
  ('d0000000-0000-4000-8000-000000000001', now() - interval '90 days', 27.4),
  ('d0000000-0000-4000-8000-000000000001', now() - interval '30 days', 28.1),
  ('d0000000-0000-4000-8000-000000000002', now() - interval '40 days', 4.2);
