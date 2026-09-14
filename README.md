# Pet Earth

PIMS clínico para veterinarias — agenda, expediente SOAP, vacunas, ticket desglosado y portal del tutor.

## Estructura

```
pet-earth/
├── apps/
│   ├── admin/      # Next.js — panel de la clínica (Vercel :3000)
│   └── web/        # Next.js — portal del tutor (Vercel :3001)
├── packages/
│   ├── shared/     # Tipos, dinero, fechas México, roles
│   └── supabase/   # Cliente tipado
└── supabase/
    ├── migrations/ # Esquema Postgres + RLS + RPCs
    └── seed.sql    # Clínica piloto Roma Norte
```

## Circuito del día

Agendar → check-in → consulta SOAP → cargos (servicio vs. medicamento) → vacuna/refuerzo → alta → cobro → seguimiento en portal.

## Requisitos

- Node.js 20+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Supabase local)
- Cuentas en [Supabase](https://supabase.com) y [Vercel](https://vercel.com)

## Inicio rápido

```bash
npm install
cp .env.example .env
cp apps/admin/.env.example apps/admin/.env.local
cp apps/web/.env.example apps/web/.env.local

npm run db:start
npm run db:reset
```

Copia URL, anon key y service role de `supabase start` a `.env`, `apps/admin/.env.local` y `apps/web/.env.local`.

```bash
npm run dev:admin   # http://localhost:3000
npm run dev:web     # http://localhost:3001
```

## Cuentas demo (`piloto123`)

| Rol | Correo | App |
|-----|--------|-----|
| Veterinaria | `vet@petearth.local` | Admin |
| Recepción | `recepcion@petearth.local` | Admin |
| Tutor (Ana) | `ana@petearth.local` | Portal |

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Despliegue Vercel](docs/DEPLOY.md)
