import {
  APPOINTMENT_STATUS_LABELS,
  type AppointmentStatus,
  REMINDER_KIND_LABELS,
  type ReminderKind,
} from '@petearth/shared';

export function appointmentTone(status: AppointmentStatus): string {
  switch (status) {
    case 'waiting':
      return 'bg-amber-100 text-amber-900';
    case 'in_consult':
      return 'bg-[rgba(96,112,64,0.12)] text-pe-clay-700';
    case 'completed':
      return 'bg-emerald-100 text-emerald-900';
    case 'cancelled':
    case 'no_show':
      return 'bg-pe-wash text-pe-muted';
    case 'confirmed':
      return 'bg-pe-wash text-pe-ink';
    default:
      return 'bg-pe-wash text-pe-ink';
  }
}

export function StatusPill({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`pe-pill ${appointmentTone(status)}`}>{APPOINTMENT_STATUS_LABELS[status]}</span>
  );
}

export function ReminderPill({ kind }: { kind: ReminderKind }) {
  return <span className="pe-pill bg-pe-wash text-pe-ink">{REMINDER_KIND_LABELS[kind]}</span>;
}
