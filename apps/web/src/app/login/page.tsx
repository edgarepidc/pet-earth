import { loadPublicClinic, internalPath } from '@/lib/clinic';
import { SiteHeader } from '@/components/SiteHeader';
import { TutorLoginForm } from '@/components/TutorLoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const clinic = await loadPublicClinic();
  const { next } = await searchParams;
  return (
    <>
      <SiteHeader
        clinicName={clinic.name}
        branchName={clinic.branches.map((branch) => branch.name).join(' · ') || clinic.branchName}
        address={clinic.address}
        hours={clinic.hours}
        phone={clinic.selectedBranch.phone}
      />
      <TutorLoginForm next={internalPath(next)} />
    </>
  );
}
