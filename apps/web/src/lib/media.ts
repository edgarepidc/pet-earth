import { createAdminClient } from '@petearth/supabase/admin';

export type TutorMediaItem = {
  id: string;
  patient_id: string;
  kind: 'photo' | 'study';
  caption: string | null;
  content_type: string | null;
  created_at: string;
  url: string | null;
};

export async function loadTutorMedia(patientIds: string[]): Promise<TutorMediaItem[]> {
  if (patientIds.length === 0) return [];
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('clinical_media')
    .select('id, patient_id, kind, caption, content_type, storage_path, created_at')
    .in('patient_id', patientIds)
    .order('created_at', { ascending: false });

  return Promise.all(
    (data ?? []).map(async (row) => {
      const { data: signed } = await supabase.storage.from('clinical-media').createSignedUrl(row.storage_path, 60 * 30);
      return {
        id: row.id,
        patient_id: row.patient_id,
        kind: row.kind,
        caption: row.caption,
        content_type: row.content_type,
        created_at: row.created_at,
        url: signed?.signedUrl ?? null,
      };
    }),
  );
}
