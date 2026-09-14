import { NextResponse } from 'next/server';

import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';

export async function GET(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ hits: [] });

  const supabase = createAdminClient();
  const like = `%${q.replaceAll('%', '')}%`;
  const [{ data: clients }, { data: patients }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, full_name, phone, email')
      .eq('organization_id', auth.organizationId)
      .or(`full_name.ilike.${like},phone.ilike.${like},email.ilike.${like}`)
      .limit(8),
    supabase
      .from('patients')
      .select('id, name, species, microchip, clients(full_name)')
      .eq('organization_id', auth.organizationId)
      .or(`name.ilike.${like},microchip.ilike.${like}`)
      .limit(8),
  ]);

  const hits = [
    ...(clients ?? []).map((client) => ({
      href: `/tutores`,
      title: client.full_name,
      subtitle: client.phone || client.email || 'Tutor',
    })),
    ...(patients ?? []).map((patient) => {
      const tutor = Array.isArray(patient.clients) ? patient.clients[0] : patient.clients;
      return {
        href: `/pacientes/${patient.id}`,
        title: patient.name,
        subtitle: tutor?.full_name ?? patient.microchip ?? 'Paciente',
      };
    }),
  ];

  return NextResponse.json({ hits });
}
