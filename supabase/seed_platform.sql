-- Añade el super admin en una base ya sembrada (producción piloto).
-- Idempotente. No toca pacientes ni citas.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values (
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
values (
  '44444444-4444-4444-8444-444444444441',
  '44444444-4444-4444-8444-444444444444',
  'plataforma@petearth.local',
  jsonb_build_object('sub', '44444444-4444-4444-8444-444444444444', 'email', 'plataforma@petearth.local'),
  'email', now(), now(), now()
)
on conflict (id) do nothing;

insert into public.profiles (id, full_name, is_platform_admin)
values
  ('44444444-4444-4444-8444-444444444444', 'Super admin Pet Earth', true)
on conflict (id) do update set
  full_name = excluded.full_name,
  is_platform_admin = true;

update public.profiles
set is_platform_admin = false
where id = '11111111-1111-4111-8111-111111111111';
