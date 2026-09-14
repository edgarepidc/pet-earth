import { STAFF_ROLE_LABELS } from '@petearth/shared';

import { AdminNav } from '@/components/AdminNav';
import { BrandLogo } from '@/components/BrandLogo';
import { BranchSwitcher } from '@/components/BranchSwitcher';
import { ClinicClock } from '@/components/ClinicClock';
import { ExitClinicButton } from '@/components/ExitClinicButton';
import { GlobalSearch } from '@/components/GlobalSearch';
import { LogoutButton } from '@/components/LogoutButton';
import { loadClinicSession } from '@/lib/auth';

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const staff = await loadClinicSession();
  const displayName = staff.fullName?.trim() || staff.email.split('@')[0] || 'equipo';

  return (
    <div className="pe-app flex min-h-screen">
      <aside className="pe-sidebar hidden w-[232px] shrink-0 flex-col px-3 py-4 lg:flex">
        <BrandLogo href="/" subtitle={staff.organizationName} inverted />
        {staff.branches.length > 1 ? (
          <div className="mt-4 px-1">
            <BranchSwitcher currentBranchId={staff.branchId} branches={staff.branches} inverted />
          </div>
        ) : (
          <p className="mt-2 truncate px-2 text-[11px] text-[#d7cfc4]">{staff.branchName}</p>
        )}
        <div className="mt-5">
          <ClinicClock />
        </div>
        <div className="mt-6 flex min-h-0 flex-1 flex-col">
          <AdminNav role={staff.role} isPlatformAdmin={staff.isPlatformAdmin} />
        </div>
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="truncate px-2 text-sm font-medium text-[#faf7f2]">{displayName}</p>
          <p className="px-2 text-[11px] text-[#a89b90]">
            {staff.viaPlatform ? 'Soporte de plataforma' : STAFF_ROLE_LABELS[staff.role]}
          </p>
          <div className="mt-2 space-y-1 px-1">
            {staff.viaPlatform ? (
              <ExitClinicButton className="w-full rounded-md border border-white/15 px-3 py-1.5 text-left text-sm text-[#d7cfc4] hover:bg-white/5 hover:text-[#faf7f2]" />
            ) : null}
            <LogoutButton className="w-full rounded-md border border-white/15 px-3 py-1.5 text-left text-sm text-[#d7cfc4] hover:bg-white/5 hover:text-[#faf7f2]" />
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="pe-glass-header flex items-center gap-3 px-3 py-2.5 lg:px-5">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <AdminNav role={staff.role} isPlatformAdmin={staff.isPlatformAdmin} />
            <BrandLogo href="/" subtitle={staff.branchName} />
          </div>
          <GlobalSearch />
          {staff.viaPlatform ? (
            <div className="hidden shrink-0 lg:block">
              <ExitClinicButton />
            </div>
          ) : null}
        </header>
        {staff.branches.length > 1 ? (
          <div className="border-b border-[var(--pe-line)] bg-[#f7efe6] px-3 py-2 lg:hidden">
            <BranchSwitcher currentBranchId={staff.branchId} branches={staff.branches} />
          </div>
        ) : null}
        {staff.viaPlatform ? (
          <div className="border-b border-[var(--pe-line)] bg-[#f7efe6] px-3 py-2 text-sm text-[#6b5e55] lg:px-5">
            Viendo {staff.organizationName} · {staff.branchName} como soporte. Los cambios quedan en esa sucursal.
          </div>
        ) : null}
        <main className="flex-1 px-3 py-4 lg:px-5 lg:py-5">{children}</main>
      </div>
    </div>
  );
}
