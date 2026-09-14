import { BrandLogo } from '@/components/BrandLogo';
import { LogoutButton } from '@/components/LogoutButton';
import { PlatformNav } from '@/components/PlatformNav';
import { loadPlatformSession } from '@/lib/auth';

export async function PlatformShell({ children }: { children: React.ReactNode }) {
  const session = await loadPlatformSession();
  const displayName = session.fullName?.trim() || session.email.split('@')[0] || 'plataforma';

  return (
    <div className="pe-app flex min-h-screen">
      <aside className="pe-sidebar hidden w-[232px] shrink-0 flex-col px-3 py-4 lg:flex">
        <BrandLogo href="/plataforma" subtitle="Plataforma" inverted />
        <PlatformNav />
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="truncate px-2 text-sm font-medium text-[#faf7f2]">{displayName}</p>
          <p className="px-2 text-[11px] text-[#a89b90]">Super admin</p>
          <div className="mt-2 px-1">
            <LogoutButton className="w-full rounded-md border border-white/15 px-3 py-1.5 text-left text-sm text-[#d7cfc4] hover:bg-white/5 hover:text-[#faf7f2]" />
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="pe-glass-header flex items-center justify-between gap-3 px-3 py-2.5 lg:px-5">
          <BrandLogo href="/plataforma" subtitle="Plataforma" />
          <LogoutButton />
        </header>
        <main className="flex-1 px-3 py-4 lg:px-5 lg:py-5">{children}</main>
      </div>
    </div>
  );
}
