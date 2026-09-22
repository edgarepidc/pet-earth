-- The MVZ on the appointment owns the receta, even if recepción abre la consulta.
create or replace function public.pe_start_visit(p_appointment_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_apt public.appointments;
  v_visit_id uuid;
  v_invoice_id uuid;
  v_consult public.catalog_items;
begin
  select * into v_apt from public.appointments where id = p_appointment_id;
  if not found then
    raise exception 'Cita no encontrada';
  end if;
  if not public.is_staff_of_branch(v_apt.branch_id) then
    raise exception 'Sin permiso';
  end if;

  select id into v_visit_id from public.visits where appointment_id = p_appointment_id;
  if found then
    return v_visit_id;
  end if;

  insert into public.visits (
    organization_id, branch_id, appointment_id, client_id, patient_id, vet_id, status
  ) values (
    v_apt.organization_id, v_apt.branch_id, v_apt.id, v_apt.client_id, v_apt.patient_id,
    coalesce(v_apt.vet_id, auth.uid()), 'in_progress'
  ) returning id into v_visit_id;

  insert into public.invoices (
    organization_id, branch_id, client_id, visit_id, status
  ) values (
    v_apt.organization_id, v_apt.branch_id, v_apt.client_id, v_visit_id, 'open'
  ) returning id into v_invoice_id;

  select * into v_consult
  from public.catalog_items
  where organization_id = v_apt.organization_id
    and kind = 'service'
    and is_active = true
    and name ilike 'Consulta general'
  order by created_at
  limit 1;

  if found then
    perform public.pe_add_visit_line(v_visit_id, v_consult.id, 1, v_consult.unit_price, v_consult.name);
  end if;

  update public.appointments
  set status = 'in_consult'
  where id = p_appointment_id;

  return v_visit_id;
end;
$$;
