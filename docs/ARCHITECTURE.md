# Pet Earth — Arquitectura

## Visión

SaaS multi-sucursal para clínicas veterinarias: webadmin clínico y portal del tutor.

## Capas

| Capa | Tecnología | Responsabilidad |
|------|------------|-----------------|
| Portal tutor | `apps/web` (Next.js) | Perfil, cartilla, altas, pendientes |
| Panel admin | `apps/admin` (Next.js) | Agenda, SOAP, ticket, seguimiento |
| API | Route handlers | Auth, citas, consultas, cobro |
| Datos | Supabase Postgres + RLS | Multi-tenant, RPCs de charge capture |

## Modelo

```
organizations
  └── branches
        ├── staff_memberships (owner | admin | vet | reception)
        ├── clients (tutores, user_id opcional para portal)
        │     └── patients
        ├── appointments → visits (SOAP) → visit_lines
        ├── invoices → invoice_lines (copia de visit_lines)
        ├── catalog_items (service | product)
        ├── vaccine_records
        └── reminders (cita | vacuna | control | desparasitación)
```

## Charge capture

`pe_add_visit_line` escribe la línea clínica y la del ticket a la vez, y descuenta stock si es producto. Cerrar la consulta (`pe_complete_visit`) deja peso, SOAP, cita en alta y un recordatorio de control.

## Seguridad

- Staff autenticado: RLS por `organization_id`.
- Tutor: lectura de su `client`, mascotas, altas, vacunas y recordatorios.
- RPCs `pe_*` comprueban `is_staff_of_branch` con `auth.uid()`.
