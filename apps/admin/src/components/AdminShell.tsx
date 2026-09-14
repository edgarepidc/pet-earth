import { mexicoDayGreeting } from '@petearth/shared';
import { redirect } from 'next/navigation';

import { AdminNav } from '@/components/AdminNav';
import { BrandLogo } from '@/components/BrandLogo';
import { LogoutButton } from '@/components/LogoutButton';
import { getStaffSession } from '@/lib/auth';

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const staff = await getStaffSession();
  if (!staff) redirect('/login');

  const displayName = staff.fullName?.trim() || staff.email.split('@')[0] || 'equipo';

  return (
    <>
      <div className="pe-ambient" aria-hidden />
      <main className="relative flex min-h-screen flex-col">
        <header className="pe-glass-header relative z-40">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-3 py-2 sm:px-4">
            <BrandLogo subtitle={staff.branchName} />
            <p className="min-w-0 flex-1 text-[11px] leading-tight text-slate-500 sm:text-xs">
              <span className="block truncate">{mexicoDayGreeting()}</span>
              <span className="block truncate font-semibold text-slate-900">{displayName}</span>
            </p>
            <AdminNav />
          </div>
        </header>
        <div className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-4 sm:py-6">{children}</div>
        <footer className="pe-glass-header mt-auto">
          <div className="mx-auto flex max-w-6xl justify-end px-3 py-2 sm:px-4">
            <LogoutButton />
          </div>
        </footer>
      </main>
    </>
  );
}
