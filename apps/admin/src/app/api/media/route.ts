import { NextResponse } from 'next/server';

import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

export async function GET(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  const url = new URL(request.url);
  const patientId = url.searchParams.get('patientId');
  const visitId = url.searchParams.get('visitId');
  if (!patientId && !visitId) {
    return NextResponse.json({ error: 'Falta paciente o consulta.' }, { status: 400 });
  }
  const supabase = createAdminClient();
  let query = supabase
    .from('clinical_media')
    .select('id, kind, caption, content_type, storage_path, created_at, patient_id, visit_id')
    .eq('organization_id', auth.organizationId)
    .order('created_at', { ascending: false });
  if (visitId) query = query.eq('visit_id', visitId);
  else if (patientId) query = query.eq('patient_id', patientId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const items = await Promise.all(
    (data ?? []).map(async (row) => {
      const { data: signed } = await supabase.storage
        .from('clinical-media')
        .createSignedUrl(row.storage_path, 60 * 30);
      return { ...row, url: signed?.signedUrl ?? null };
    }),
  );
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  const form = await request.formData();
  const file = form.get('file');
  const patientId = String(form.get('patientId') ?? '');
  const visitId = String(form.get('visitId') ?? '') || null;
  const kind = form.get('kind') === 'study' ? 'study' : 'photo';
  const caption = String(form.get('caption') ?? '').trim() || null;
  if (!(file instanceof File) || !patientId) {
    return NextResponse.json({ error: 'Archivo y paciente son obligatorios.' }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: 'Solo JPG, PNG, WebP o PDF.' }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'El archivo no puede pesar más de 10 MB.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .eq('organization_id', auth.organizationId)
    .maybeSingle();
  if (!patient) return NextResponse.json({ error: 'Paciente no encontrado.' }, { status: 404 });

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const path = `${auth.organizationId}/${patientId}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from('clinical-media').upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

  const { data, error } = await supabase
    .from('clinical_media')
    .insert({
      organization_id: auth.organizationId,
      patient_id: patientId,
      visit_id: visitId,
      kind,
      storage_path: path,
      caption,
      content_type: file.type,
      created_by: auth.userId,
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id });
}
