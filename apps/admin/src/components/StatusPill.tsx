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
      return 'bg-[#f3e4da] text-[#8f4328]';
    case 'completed':
      return 'bg-emerald-100 text-emerald-900';
    case 'cancelled':
    case 'no_show':
      return 'bg-[#ebe4da] text-[#6b5e55]';
    case 'confirmed':
      return 'bg-[#efe8de] text-[#3c322c]';
    default:
      return 'bg-[#efe8de] text-[#3c322c]';
  }
}

export function StatusPill({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`pe-pill ${appointmentTone(status)}`}>{APPOINTMENT_STATUS_LABELS[status]}</span>
  );
}

export function ReminderPill({ kind }: { kind: ReminderKind }) {
  return <span className="pe-pill bg-[#efe8de] text-[#3c322c]">{REMINDER_KIND_LABELS[kind]}</span>;
}
