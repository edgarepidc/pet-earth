import { LogoutButton } from '@/components/LogoutButton';

export function TutorShell({
  clinicName,
  tutorName,
  children,
}: {
  clinicName: string;
  tutorName: string;
  children: React.ReactNode;
}) {
  return (
    <main className="pe-app min-h-screen px-5 py-10 sm:px-10 lg:px-16">
      <header className="mb-8 flex max-w-2xl items-start justify-between gap-4">
        <div>
          <p className="pe-kicker">{clinicName}</p>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Cartilla</h1>
          <p className="mt-1 text-sm text-pe-muted">{tutorName}</p>
        </div>
        <LogoutButton />
      </header>
      <div className="max-w-2xl">{children}</div>
    </main>
  );
}
