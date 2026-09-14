import Link from 'next/link';
import { formatMexicoDate } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { EnterClinicButton } from '@/components/EnterClinicButton';
import { PlatformShell } from '@/components/PlatformShell';
import { loadPlatformSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function PlataformaPage() {
  await loadPlatformSession();
  const supabase = createAdminClient();
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug, created_at')
    .order('created_at', { ascending: false });
  const ids = (orgs ?? []).map((org) => org.id);
  const { data: branches } = ids.length
    ? await supabase
        .from('branches')
        .select('id, organization_id, name, is_active')
        .in('organization_id', ids)
        .eq('is_active', true)
        .order('created_at')
    : { data: [] };

  return (
    <PlatformShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="pe-kicker">Super admin</p>
          <h1 className="font-serif text-3xl font-semibold">Veterinarias</h1>
          <p className="mt-1 text-sm text-[#6b5e55]">
            Alta de clínicas y sucursales. Entra al panel de una para dar soporte.
          </p>
        </div>
        <Link href="/plataforma/nueva" className="pe-btn-primary px-4 py-2 text-sm">
          Nueva veterinaria
        </Link>
      </div>

      <ul className="mt-6 space-y-3">
        {(orgs ?? []).map((org) => {
          const orgBranches = (branches ?? []).filter((branch) => branch.organization_id === org.id);
          const first = orgBranches[0];
          return (
            <li key={org.id} className="pe-card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <Link href={`/plataforma/${org.id}`} className="font-serif text-lg font-semibold no-underline">
                  {org.name}
                </Link>
                <p className="text-sm text-[#6b5e55]">
                  {org.slug} · {orgBranches.length === 1 ? '1 sucursal' : `${orgBranches.length} sucursales`} · alta{' '}
                  {formatMexicoDate(org.created_at.slice(0, 10))}
                </p>
                {orgBranches.length > 0 ? (
                  <p className="mt-1 text-sm text-[#6b5e55]">{orgBranches.map((branch) => branch.name).join(' · ')}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {first ? <EnterClinicButton organizationId={org.id} branchId={first.id} /> : null}
                <Link href={`/plataforma/${org.id}`} className="pe-btn-ghost px-3 py-1.5 text-sm">
                  Configurar
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </PlatformShell>
  );
}
