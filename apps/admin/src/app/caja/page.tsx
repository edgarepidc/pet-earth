import { AdminShell } from '@/components/AdminShell';
import { CashierDesk } from '@/components/CashierDesk';
import { getStaffSession } from '@/lib/auth';
import { loadOpenInvoices } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function CajaPage() {
  const staff = await getStaffSession();
  if (!staff) return null;
  const invoices = await loadOpenInvoices(staff.organizationId, staff.branchId);
  return (
    <AdminShell>
      <CashierDesk invoices={invoices as never} />
    </AdminShell>
  );
}
