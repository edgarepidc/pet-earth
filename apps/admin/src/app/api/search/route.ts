import { NextResponse } from 'next/server';

import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';

type Hit = { href: string; title: string; subtitle: string };

export async function GET(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ hits: [] });

  const supabase = createAdminClient();
  const safe = q.replaceAll('%', '').replaceAll(',', ' ').replaceAll('(', ' ').replaceAll(')', ' ');
  const like = `%${safe}%`;
  const digits = safe.replace(/\D/g, '');
  const clientOr = [`full_name.ilike.${like}`, `phone.ilike.${like}`, `email.ilike.${like}`];
  if (digits.length >= 2) clientOr.push(`phone.ilike.%${digits}%`);
  const patientOr = [`name.ilike.${like}`, `microchip.ilike.${like}`];
  if (digits.length >= 2) patientOr.push(`microchip.ilike.%${digits}%`);

  const [{ data: clients }, { data: patients }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, full_name, phone, email, patients(id, name)')
      .eq('organization_id', auth.organizationId)
      .or(clientOr.join(','))
      .limit(8),
    supabase
      .from('patients')
      .select('id, name, species, microchip, clients(full_name, phone, email)')
      .eq('organization_id', auth.organizationId)
      .or(patientOr.join(','))
      .limit(8),
  ]);

  const hits: Hit[] = [];
  const seenPatients = new Set<string>();

  for (const client of clients ?? []) {
    hits.push({
      href: '/tutores',
      title: client.full_name,
      subtitle: [client.phone, client.email].filter(Boolean).join(' · ') || 'Tutor',
    });
    const pets = Array.isArray(client.patients) ? client.patients : client.patients ? [client.patients] : [];
    for (const pet of pets) {
      if (!pet?.id || seenPatients.has(pet.id)) continue;
      seenPatients.add(pet.id);
      hits.push({
        href: `/pacientes/${pet.id}`,
        title: pet.name,
        subtitle: client.full_name,
      });
    }
  }

  for (const patient of patients ?? []) {
    if (seenPatients.has(patient.id)) continue;
    seenPatients.add(patient.id);
    const tutor = Array.isArray(patient.clients) ? patient.clients[0] : patient.clients;
    hits.push({
      href: `/pacientes/${patient.id}`,
      title: patient.name,
      subtitle: [tutor?.full_name, patient.microchip, tutor?.phone].filter(Boolean).join(' · ') || 'Paciente',
    });
  }

  return NextResponse.json({ hits: hits.slice(0, 12) });
}
