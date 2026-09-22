import {
  APPOINTMENT_STATUS_LABELS,
  type AppointmentStatus,
  REMINDER_KIND_LABELS,
  type ReminderKind,
} from '@petearth/shared';

export function appointmentTone(status: AppointmentStatus): string {
  switch (status) {
    case 'waiting':
      return 'bg-amber-200 text-amber-950 ring-2 ring-amber-400';
    case 'in_consult':
      return 'bg-[#d7e0c8] text-pe-clay-700 ring-2 ring-pe-clay';
    case 'completed':
      return 'bg-emerald-200 text-emerald-950 ring-2 ring-emerald-500';
    case 'no_show':
      return 'bg-rose-200 text-rose-950 ring-2 ring-rose-400';
    case 'cancelled':
      return 'bg-zinc-100 text-zinc-500 ring-1 ring-zinc-300';
    case 'confirmed':
    case 'scheduled':
    default:
      return 'bg-sky-100 text-sky-950 ring-2 ring-sky-400';
  }
}

export function appointmentOutline(status: AppointmentStatus): string {
  switch (status) {
    case 'waiting':
      return 'border-amber-400';
    case 'in_consult':
      return 'border-pe-clay';
    case 'completed':
      return 'border-emerald-500';
    case 'no_show':
      return 'border-rose-400';
    case 'cancelled':
      return 'border-zinc-300 text-pe-muted';
    case 'confirmed':
    case 'scheduled':
    default:
      return 'border-sky-400';
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
