import { canTakePayment } from '@petearth/shared';
import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/AdminShell';
import { CashierDesk } from '@/components/CashierDesk';
import { loadClinicSession } from '@/lib/auth';
import { loadCfdiQueue, loadOpenInvoices } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function CajaPage() {
  const staff = await loadClinicSession();
  if (!canTakePayment(staff.role) && !staff.isPlatformAdmin) redirect('/');
  const [invoices, cfdiQueue] = await Promise.all([
    loadOpenInvoices(staff.organizationId, staff.branchId),
    loadCfdiQueue(staff.organizationId, staff.branchId),
  ]);
  return (
    <AdminShell>
      <CashierDesk invoices={invoices as never} cfdiQueue={cfdiQueue as never} branchName={staff.branchName} />
    </AdminShell>
  );
}
