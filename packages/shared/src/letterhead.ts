export const DEFAULT_RX_FOOTER =
  'Esta receta no sustituye una consulta. Cualquier duda, llama al consultorio.';

export type ClinicLetterhead = {
  logo: string | null;
  footer: string;
  showAssessment: boolean;
  showPlan: boolean;
  showMeds: boolean;
  showVaccines: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function mediaUrl(value: unknown): string | null {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return null;
  if (trimmed.startsWith('/catalog/') || trimmed.startsWith('/marks/') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return null;
}

function flag(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

export function parseLetterhead(settings: unknown): ClinicLetterhead {
  const root = asRecord(settings);
  const raw = asRecord(root?.letterhead) ?? {};
  const footer = typeof raw.footer === 'string' && raw.footer.trim() ? raw.footer.trim() : DEFAULT_RX_FOOTER;
  return {
    logo: mediaUrl(raw.logo),
    footer,
    showAssessment: flag(raw.showAssessment, true),
    showPlan: flag(raw.showPlan, true),
    showMeds: flag(raw.showMeds, true),
    showVaccines: flag(raw.showVaccines, true),
  };
}

export function letterheadPayload(input: Partial<ClinicLetterhead>): ClinicLetterhead {
  return {
    logo: mediaUrl(input.logo),
    footer: input.footer?.trim() || DEFAULT_RX_FOOTER,
    showAssessment: input.showAssessment !== false,
    showPlan: input.showPlan !== false,
    showMeds: input.showMeds !== false,
    showVaccines: input.showVaccines !== false,
  };
}
