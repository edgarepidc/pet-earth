import { loadPublicClinic } from '@/lib/clinic';
import { SiteHeader } from '@/components/SiteHeader';
import { TutorLoginForm } from '@/components/TutorLoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const clinic = await loadPublicClinic();
  return (
    <>
      <SiteHeader
        clinicName={clinic.name}
        branchName={clinic.branchName}
        address={clinic.address}
        hours={clinic.hours}
      />
      <TutorLoginForm />
    </>
  );
}
