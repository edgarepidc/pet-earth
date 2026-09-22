alter table public.profiles
  add column if not exists license text;

alter table public.visit_lines
  add column if not exists directions text;
