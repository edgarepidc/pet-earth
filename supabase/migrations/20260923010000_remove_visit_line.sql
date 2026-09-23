create or replace function public.pe_remove_visit_line(p_line_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_line public.visit_lines;
  v_visit public.visits;
  v_invoice public.invoices;
begin
  select * into v_line from public.visit_lines where id = p_line_id;
  if not found then
    raise exception 'Cargo no encontrado';
  end if;

  select * into v_visit from public.visits where id = v_line.visit_id;
  if not found then
    raise exception 'Consulta no encontrada';
  end if;
  if v_visit.status <> 'in_progress' then
    raise exception 'La consulta ya está cerrada';
  end if;
  if not public.is_staff_of_branch(v_visit.branch_id) then
    raise exception 'Sin permiso';
  end if;

  select * into v_invoice from public.invoices where visit_id = v_visit.id;
  if found and v_invoice.status = 'paid' then
    raise exception 'El ticket ya está cobrado';
  end if;

  delete from public.invoice_lines where visit_line_id = v_line.id;
  delete from public.visit_lines where id = v_line.id;

  if v_line.kind = 'product' and v_line.catalog_item_id is not null then
    update public.catalog_items
    set stock = coalesce(stock, 0) + v_line.quantity
    where id = v_line.catalog_item_id
      and stock is not null;
  end if;

  if v_invoice.id is not null then
    perform public.recalc_invoice(v_invoice.id);
  end if;
end;
$$;

grant execute on function public.pe_remove_visit_line(uuid) to authenticated;
