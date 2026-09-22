import { NextResponse } from 'next/server';

import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';

const BUCKET = 'clinic-public';
const FOLDERS = new Set(['branches', 'letterhead', 'catalog']);
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024;

function extensionFor(type: string) {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

async function ensurePublicBucket() {
  const supabase = createAdminClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((bucket) => bucket.id === BUCKET)) return supabase;
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });
  if (error && !error.message.toLowerCase().includes('already exists')) {
    throw new Error(error.message);
  }
  return supabase;
}

export async function POST(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Falta la foto.' }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: 'Solo JPG, PNG o WebP.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'La foto no puede pesar más de 5 MB.' }, { status: 400 });
  }

  try {
    const supabase = await ensurePublicBucket();
    const folder = FOLDERS.has(String(form.get('folder'))) ? String(form.get('folder')) : 'branches';
    const path = `${auth.organizationId}/${folder}/${crypto.randomUUID()}.${extensionFor(file.type)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    if (!data.publicUrl) {
      return NextResponse.json({ error: 'No se pudo publicar la foto.' }, { status: 400 });
    }
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo subir la foto.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
