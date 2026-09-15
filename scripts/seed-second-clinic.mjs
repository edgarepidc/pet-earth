import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    const file = resolve(root, name);
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error('Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = 'piloto123';
const ORG_ID = 'a0000000-0000-4000-8000-000000000002';
const BRANCH_ID = 'b0000000-0000-4000-8000-000000000002';
const VET_ID = '55555555-5555-4555-8555-555555555555';
const RECEP_ID = '66666666-6666-4666-8666-666666666666';
const TUTOR_ID = '77777777-7777-4777-8777-777777777777';
const CLIENT_ID = 'c0000000-0000-4000-8000-000000000011';
const PATIENT_ID = 'd0000000-0000-4000-8000-000000000011';

async function ensureUser(id, email, fullName) {
  const { data: existing } = await supabase.auth.admin.getUserById(id);
  if (existing.user) {
    await supabase.from('profiles').upsert({ id, full_name: fullName, is_platform_admin: false });
    return id;
  }
  const found = await findByEmail(email);
  if (found) {
    await supabase.from('profiles').upsert({ id: found, full_name: fullName, is_platform_admin: false });
    return found;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    id,
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) throw new Error(error?.message ?? `No se pudo crear ${email}`);
  await supabase.from('profiles').upsert({ id: data.user.id, full_name: fullName, is_platform_admin: false });
  return data.user.id;
}

async function findByEmail(email) {
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const hit = data.users.find((user) => user.email?.toLowerCase() === email);
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

const vetId = await ensureUser(VET_ID, 'sofia@petearth.local', 'Dra. Sofía Herrera');
const recepId = await ensureUser(RECEP_ID, 'marta@petearth.local', 'Marta León');
const tutorId = await ensureUser(TUTOR_ID, 'paola@petearth.local', 'Paola Vega');

const { error: orgError } = await supabase.from('organizations').upsert({
  id: ORG_ID,
  name: 'Veterinaria Del Valle',
  slug: 'del-valle',
  settings: {
    fiscal: {
      rfc: 'VVA010101AA3',
      razonSocial: 'Veterinaria Del Valle SA de CV',
      regimen: '612',
      codigoPostal: '03100',
    },
  },
});
if (orgError) throw new Error(orgError.message);

const { error: branchError } = await supabase.from('branches').upsert({
  id: BRANCH_ID,
  organization_id: ORG_ID,
  name: 'Del Valle',
  slug: 'del-valle',
  address: 'Insurgentes Sur 1235, Del Valle, CDMX',
  is_active: true,
});
if (branchError) throw new Error(branchError.message);

for (const row of [
  { user_id: vetId, role: 'vet' },
  { user_id: recepId, role: 'reception' },
]) {
  const { error } = await supabase.from('staff_memberships').upsert(
    {
      user_id: row.user_id,
      organization_id: ORG_ID,
      branch_id: BRANCH_ID,
      role: row.role,
      status: 'active',
    },
    { onConflict: 'user_id,organization_id' },
  );
  if (error) throw new Error(error.message);
}

const { error: clientError } = await supabase.from('clients').upsert({
  id: CLIENT_ID,
  organization_id: ORG_ID,
  user_id: tutorId,
  full_name: 'Paola Vega',
  phone: '5552223344',
  email: 'paola@petearth.local',
});
if (clientError) throw new Error(clientError.message);

const { error: patientError } = await supabase.from('patients').upsert({
  id: PATIENT_ID,
  organization_id: ORG_ID,
  client_id: CLIENT_ID,
  name: 'Nube',
  species: 'cat',
  breed: 'Siamés',
  sex: 'female',
  neutered: true,
  color: 'Crema',
  alerts: 'No mezclar con Pet Earth Roma Norte',
});
if (patientError) throw new Error(patientError.message);

await supabase.from('catalog_items').upsert([
  {
    id: 'e0000000-0000-4000-8000-000000000011',
    organization_id: ORG_ID,
    kind: 'service',
    name: 'Consulta general',
    sku: 'VV-CON',
    unit_price: 520,
    is_active: true,
  },
  {
    id: 'e0000000-0000-4000-8000-000000000012',
    organization_id: ORG_ID,
    kind: 'product',
    name: 'Vacuna triple felina',
    sku: 'VV-TRF',
    unit_price: 720,
    stock: 8,
    min_stock: 3,
    is_active: true,
  },
]);

const start = new Date();
const mxParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).formatToParts(start);
const ymd = `${mxParts.find((p) => p.type === 'year')?.value}-${mxParts.find((p) => p.type === 'month')?.value}-${mxParts.find((p) => p.type === 'day')?.value}`;
const startsAt = `${ymd}T10:00:00-06:00`;
const endsAt = `${ymd}T10:30:00-06:00`;

await supabase.from('appointments').upsert({
  id: 'f0000000-0000-4000-8000-000000000011',
  organization_id: ORG_ID,
  branch_id: BRANCH_ID,
  client_id: CLIENT_ID,
  patient_id: PATIENT_ID,
  vet_id: vetId,
  starts_at: startsAt,
  ends_at: endsAt,
  status: 'scheduled',
  reason: 'Control postoperatorio',
});

await supabase.from('reminders').upsert({
  id: 'bb000000-0000-4000-8000-000000000011',
  organization_id: ORG_ID,
  client_id: CLIENT_ID,
  patient_id: PATIENT_ID,
  kind: 'followup',
  title: 'Revisión de herida — Nube',
  due_on: ymd,
  status: 'pending',
});

const { data: petEarth } = await supabase
  .from('organizations')
  .select('id, settings')
  .eq('id', 'a0000000-0000-4000-8000-000000000001')
  .maybeSingle();
const fiscal = petEarth?.settings?.fiscal;
if (petEarth && !fiscal?.rfc) {
  await supabase
    .from('organizations')
    .update({
      settings: {
        ...(petEarth.settings ?? {}),
        fiscal: {
          rfc: 'PEA0101013A9',
          razonSocial: 'Clínica Pet Earth SA de CV',
          regimen: '612',
          codigoPostal: '06700',
        },
      },
    })
    .eq('id', petEarth.id);
}

console.log('Veterinaria Del Valle lista. Entra con sofia@petearth.local o marta@petearth.local / piloto123');
