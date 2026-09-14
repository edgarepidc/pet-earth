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
    <main className="pe-app mx-auto min-h-screen max-w-3xl px-4 py-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="pe-kicker">{clinicName}</p>
          <h1 className="font-serif text-3xl font-semibold">Cartilla</h1>
          <p className="mt-1 text-sm text-[#6b5e55]">{tutorName}</p>
        </div>
        <LogoutButton />
      </header>
      {children}
    </main>
  );
}
