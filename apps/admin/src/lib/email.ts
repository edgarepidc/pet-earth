import {
  reminderEmailHtml,
  reminderEmailSubject,
  reminderEmailText,
} from '@petearth/shared';
import { Resend } from 'resend';

function fromAddress() {
  return process.env.RESEND_FROM?.trim() || 'Pet Earth <onboarding@resend.dev>';
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendClinicEmail(input: {
  to: string;
  clinicName: string;
  tutorName: string;
  patientName: string;
  title: string;
  dueOn: string;
  branchName?: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { ok: false as const, error: 'Falta RESEND_API_KEY. Conecta Resend con un dominio propio.' };
  }
  const resend = new Resend(key);
  const payload = {
    tutorName: input.tutorName,
    patientName: input.patientName,
    clinicName: input.clinicName,
    title: input.title,
    dueOn: input.dueOn,
    branchName: input.branchName,
  };
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: input.to,
    subject: reminderEmailSubject(input.clinicName, input.title),
    text: reminderEmailText(payload),
    html: reminderEmailHtml(payload),
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
