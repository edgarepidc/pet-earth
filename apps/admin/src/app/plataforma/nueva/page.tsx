import { CreateClinicForm } from '@/components/CreateClinicForm';
import { PlatformShell } from '@/components/PlatformShell';
import { loadPlatformSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function NuevaClinicaPage() {
  await loadPlatformSession();
  return (
    <PlatformShell>
      <CreateClinicForm />
    </PlatformShell>
  );
}
