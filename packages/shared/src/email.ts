export function reminderEmailSubject(clinicName: string, title: string) {
  return `${clinicName}: ${title}`;
}

export function reminderEmailText(input: {
  tutorName: string;
  patientName: string;
  clinicName: string;
  title: string;
  dueOn: string;
  branchName?: string;
}) {
  const donde = input.branchName ? ` en ${input.branchName}` : '';
  return [
    `Hola ${input.tutorName},`,
    '',
    `${input.patientName} tiene pendiente: ${input.title}.`,
    `Fecha: ${input.dueOn}${donde}.`,
    '',
    `Te escribe ${input.clinicName}. Si ya lo agendaste, ignora este correo.`,
  ].join('\n');
}

export function reminderEmailHtml(input: {
  tutorName: string;
  patientName: string;
  clinicName: string;
  title: string;
  dueOn: string;
  branchName?: string;
}) {
  const donde = input.branchName ? ` en ${input.branchName}` : '';
  return `<p>Hola ${escapeHtml(input.tutorName)},</p>
<p><strong>${escapeHtml(input.patientName)}</strong> tiene pendiente: ${escapeHtml(input.title)}.</p>
<p>Fecha: ${escapeHtml(input.dueOn)}${escapeHtml(donde)}.</p>
<p>Te escribe ${escapeHtml(input.clinicName)}. Si ya lo agendaste, ignora este correo.</p>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
