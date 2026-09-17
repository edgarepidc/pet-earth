import { DEFAULT_SPECIES_OPTIONS, type ClinicListOption } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

export type ClinicListRow = ClinicListOption & {
  id: string;
  is_active: boolean;
  sort_order: number;
};

export async function loadSpeciesOptions(organizationId: string, includeInactive = false): Promise<ClinicListOption[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from('clinic_lists')
    .select('slug, label, is_active, sort_order')
    .eq('organization_id', organizationId)
    .eq('list_key', 'species')
    .order('sort_order')
    .order('label');
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error || !data?.length) return DEFAULT_SPECIES_OPTIONS;
  return data.map((row) => ({ slug: row.slug, label: row.label }));
}

export async function loadSpeciesList(organizationId: string): Promise<ClinicListRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('clinic_lists')
    .select('id, slug, label, is_active, sort_order')
    .eq('organization_id', organizationId)
    .eq('list_key', 'species')
    .order('sort_order')
    .order('label');
  if (error) throw new Error(error.message);
  return (data ?? []) as ClinicListRow[];
}

export async function seedDefaultSpecies(organizationId: string) {
  const supabase = createAdminClient();
  await supabase.from('clinic_lists').upsert(
    DEFAULT_SPECIES_OPTIONS.map((item, index) => ({
      organization_id: organizationId,
      list_key: 'species' as const,
      slug: item.slug,
      label: item.label,
      sort_order: (index + 1) * 10,
      is_active: true,
    })),
    { onConflict: 'organization_id,list_key,slug' },
  );
}
