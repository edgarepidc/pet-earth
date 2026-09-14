import { createAdminClient } from '@petearth/supabase/admin';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getTutorContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const admin = createAdminClient();
  const { data: client } = await admin
    .from('clients')
    .select('id, full_name, organization_id, phone, email')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!client) return null;

  const { data: org } = await admin.from('organizations').select('name').eq('id', client.organization_id).maybeSingle();

  return {
    userId: user.id,
    email: user.email,
    clientId: client.id,
    clientName: client.full_name,
    organizationId: client.organization_id,
    clinicName: org?.name ?? 'Pet Earth',
  };
}
