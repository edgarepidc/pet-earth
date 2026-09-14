export function mexicoWhatsAppNumber(raw: string | null | undefined): string | null {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 12 && digits.startsWith('52')) return digits;
  if (digits.length === 13 && digits.startsWith('521')) return digits;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

export function whatsappHref(phone: string | null | undefined, text: string): string | null {
  const number = mexicoWhatsAppNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function appointmentWhatsAppText(input: {
  tutorName: string;
  patientName: string;
  clinicName: string;
  when: string;
}): string {
  return `Hola ${input.tutorName}, te recordamos la cita de ${input.patientName} en ${input.clinicName}: ${input.when}.`;
}

export function vaccineWhatsAppText(input: {
  tutorName: string;
  patientName: string;
  clinicName: string;
  title: string;
  dueOn: string;
}): string {
  return `Hola ${input.tutorName}, ${input.patientName} tiene pendiente ${input.title} (${input.dueOn}) en ${input.clinicName}.`;
}
