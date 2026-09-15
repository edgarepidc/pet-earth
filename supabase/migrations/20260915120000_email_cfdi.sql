-- Recordatorios por correo y rastro de timbrado CFDI (sin UUID inventado).

alter table public.reminders
  add column if not exists last_emailed_at timestamptz;

alter table public.invoices
  add column if not exists cfdi_error text,
  add column if not exists cfdi_stamped_at timestamptz;
