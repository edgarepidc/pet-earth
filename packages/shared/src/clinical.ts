export const MEXICO_TZ = 'America/Mexico_City';

export const STAFF_ROLES = ['owner', 'admin', 'vet', 'reception'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  owner: 'Dueño',
  admin: 'Administración',
  vet: 'Veterinario',
  reception: 'Recepción',
};

export function normalizeStaffRole(value: string | null | undefined): StaffRole | null {
  if (!value) return null;
  return STAFF_ROLES.includes(value as StaffRole) ? (value as StaffRole) : null;
}

export function canEditClinical(role: StaffRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'vet';
}

export function canTakePayment(role: StaffRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'reception';
}

export function canManageCatalog(role: StaffRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function slugify(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || 'clinica';
}

export const SPECIES = ['dog', 'cat', 'other'] as const;
export type Species = (typeof SPECIES)[number];
export const SPECIES_LABELS: Record<Species, string> = {
  dog: 'Perro',
  cat: 'Gato',
  other: 'Otra',
};

export const SEXES = ['male', 'female', 'unknown'] as const;
export type Sex = (typeof SEXES)[number];
export const SEX_LABELS: Record<Sex, string> = {
  male: 'Macho',
  female: 'Hembra',
  unknown: 'No especificado',
};

export const APPOINTMENT_STATUSES = [
  'scheduled',
  'confirmed',
  'waiting',
  'in_consult',
  'completed',
  'no_show',
  'cancelled',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Agendada',
  confirmed: 'Confirmada',
  waiting: 'En espera',
  in_consult: 'En consulta',
  completed: 'Alta',
  no_show: 'No se presentó',
  cancelled: 'Cancelada',
};

export const VISIT_STATUSES = ['in_progress', 'completed'] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

export const CATALOG_KINDS = ['service', 'product'] as const;
export type CatalogKind = (typeof CATALOG_KINDS)[number];
export const CATALOG_KIND_LABELS: Record<CatalogKind, string> = {
  service: 'Servicio',
  product: 'Medicamento / producto',
};

export const INVOICE_STATUSES = ['estimate', 'open', 'paid', 'cancelled'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  estimate: 'Presupuesto',
  open: 'Por cobrar',
  paid: 'Pagada',
  cancelled: 'Cancelada',
};

export const PAYMENT_METHODS = ['cash', 'card', 'transfer'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

export const REMINDER_KINDS = ['appointment', 'vaccine', 'followup', 'deworming'] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];
export const REMINDER_KIND_LABELS: Record<ReminderKind, string> = {
  appointment: 'Cita',
  vaccine: 'Vacuna',
  followup: 'Control',
  deworming: 'Desparasitación',
};

export const REMINDER_STATUSES = ['pending', 'done', 'cancelled'] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];
