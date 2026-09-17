import { PageHeading } from '@/components/SectionTitle';
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
          <PageHeading mark="cartilla" kicker={clinicName} title="Cartilla" description={tutorName} serif size="lg" />
        </div>
        <LogoutButton />
      </header>
      <div className="max-w-2xl">{children}</div>
    </main>
  );
}
