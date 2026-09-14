import { AdminShell } from '@/components/AdminShell';
import { CashierDesk } from '@/components/CashierDesk';
import { loadClinicSession } from '@/lib/auth';
import { loadOpenInvoices } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function CajaPage() {
  const staff = await loadClinicSession();
  const invoices = await loadOpenInvoices(staff.organizationId, staff.branchId);
  return (
    <AdminShell>
      <CashierDesk invoices={invoices as never} branchName={staff.branchName} />
    </AdminShell>
  );
}
