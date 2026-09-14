import { STAFF_ROLE_LABELS } from '@petearth/shared';
import { redirect } from 'next/navigation';

import { AdminNav } from '@/components/AdminNav';
import { BrandLogo } from '@/components/BrandLogo';
import { ClinicClock } from '@/components/ClinicClock';
import { GlobalSearch } from '@/components/GlobalSearch';
import { LogoutButton } from '@/components/LogoutButton';
import { getStaffSession } from '@/lib/auth';

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const staff = await getStaffSession();
  if (!staff) redirect('/login');

  const displayName = staff.fullName?.trim() || staff.email.split('@')[0] || 'equipo';

  return (
    <div className="pe-app flex min-h-screen">
      <aside className="pe-sidebar hidden w-[232px] shrink-0 flex-col px-3 py-4 lg:flex">
        <BrandLogo href="/" subtitle={staff.branchName} inverted />
        <div className="mt-5">
          <ClinicClock />
        </div>
        <div className="mt-6 flex min-h-0 flex-1 flex-col">
          <AdminNav role={staff.role} />
        </div>
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="truncate px-2 text-sm font-medium text-[#faf7f2]">{displayName}</p>
          <p className="px-2 text-[11px] text-[#a89b90]">{STAFF_ROLE_LABELS[staff.role]}</p>
          <div className="mt-2 px-1">
            <LogoutButton className="w-full rounded-md border border-white/15 px-3 py-1.5 text-left text-sm text-[#d7cfc4] hover:bg-white/5 hover:text-[#faf7f2]" />
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="pe-glass-header flex items-center gap-3 px-3 py-2.5 lg:px-5">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <AdminNav role={staff.role} />
            <BrandLogo href="/" subtitle={staff.branchName} />
          </div>
          <GlobalSearch />
        </header>
        <main className="flex-1 px-3 py-4 lg:px-5 lg:py-5">{children}</main>
      </div>
    </div>
  );
}
