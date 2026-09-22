insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clinic-public',
  'clinic-public',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read clinic-public" on storage.objects;
create policy "public read clinic-public" on storage.objects
  for select
  using (bucket_id = 'clinic-public');
