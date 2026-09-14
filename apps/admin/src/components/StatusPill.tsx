import {
  APPOINTMENT_STATUS_LABELS,
  type AppointmentStatus,
  REMINDER_KIND_LABELS,
  type ReminderKind,
} from '@petearth/shared';

export function appointmentTone(status: AppointmentStatus): string {
  switch (status) {
    case 'waiting':
      return 'bg-amber-100 text-amber-800';
    case 'in_consult':
      return 'bg-sky-100 text-sky-800';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800';
    case 'cancelled':
    case 'no_show':
      return 'bg-slate-200 text-slate-600';
    case 'confirmed':
      return 'bg-teal-100 text-teal-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export function StatusPill({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`pe-pill ${appointmentTone(status)}`}>{APPOINTMENT_STATUS_LABELS[status]}</span>
  );
}

export function ReminderPill({ kind }: { kind: ReminderKind }) {
  return <span className="pe-pill bg-slate-100 text-slate-700">{REMINDER_KIND_LABELS[kind]}</span>;
}
