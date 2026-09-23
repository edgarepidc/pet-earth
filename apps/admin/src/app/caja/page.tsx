import { canTakePayment, todayMexicoYmd } from '@petearth/shared';
import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/AdminShell';
import { CashierDesk } from '@/components/CashierDesk';
import { loadClinicSession } from '@/lib/auth';
import { loadCfdiQueue, loadOpenInvoices, loadPaidToday } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function CajaPage() {
  const staff = await loadClinicSession();
  if (!canTakePayment(staff.role) && !staff.isPlatformAdmin) redirect('/agenda');
  const [invoices, paidToday, cfdiQueue] = await Promise.all([
    loadOpenInvoices(staff.organizationId, staff.branchId),
    loadPaidToday(staff.organizationId, staff.branchId, todayMexicoYmd()),
    loadCfdiQueue(staff.organizationId, staff.branchId),
  ]);
  return (
    <AdminShell>
      <CashierDesk
        invoices={invoices as never}
        paidToday={paidToday as never}
        cfdiQueue={cfdiQueue as never}
        branchName={staff.branchName}
      />
    </AdminShell>
  );
}
