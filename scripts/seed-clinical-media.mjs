import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv(file) {
  const text = readFileSync(file, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(resolve(process.cwd(), 'apps/web/.env.local'));

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');

const supabase = createClient(url, key, { auth: { persistSession: false } });
const org = 'a0000000-0000-4000-8000-000000000001';
const luna = 'd0000000-0000-4000-8000-000000000001';
const milo = 'd0000000-0000-4000-8000-000000000002';
const root = resolve(process.cwd(), 'apps/web/public/marks');

const files = [
  {
    id: 'aa000000-0000-4000-8000-000000000001',
    patient: luna,
    kind: 'study',
    path: `${org}/${luna}/rx-cadera.png`,
    file: resolve(root, 'informes.png'),
    caption: 'Radiografía de cadera',
  },
  {
    id: 'aa000000-0000-4000-8000-000000000002',
    patient: luna,
    kind: 'study',
    path: `${org}/${luna}/laboratorio.png`,
    file: resolve(root, 'consulta.png'),
    caption: 'Laboratorio de control',
  },
  {
    id: 'aa000000-0000-4000-8000-000000000003',
    patient: milo,
    kind: 'photo',
    path: `${org}/${milo}/lesion.png`,
    file: resolve(root, 'seguimiento.png'),
    caption: 'Foto de lesión en consulta',
  },
];

for (const item of files) {
  const body = readFileSync(item.file);
  const upload = await supabase.storage.from('clinical-media').upload(item.path, body, {
    contentType: 'image/png',
    upsert: true,
  });
  if (upload.error) throw new Error(upload.error.message);
  const { error } = await supabase.from('clinical_media').upsert({
    id: item.id,
    organization_id: org,
    patient_id: item.patient,
    kind: item.kind,
    storage_path: item.path,
    caption: item.caption,
    content_type: 'image/png',
  });
  if (error) throw new Error(error.message);
  console.log(`ok ${item.caption}`);
}
