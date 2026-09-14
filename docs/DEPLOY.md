# Despliegue en Vercel + Supabase

Producción piloto:

- Supabase: [pet-earth-prod](https://supabase.com/dashboard/project/uhqybgptqhaycrkhqxnp) (`uhqybgptqhaycrkhqxnp`, `us-east-1`)
- Vercel admin: `pet-earth-admin` (root `apps/admin`)
- Vercel portal: `pet-earth-web` (root `apps/web`)

## Recrear (como Puerta Verde / Veka)

```bash
npm run create:supabase   # crea proyecto, aplica migraciones y seed
# commit + push a edgarepidc/pet-earth
npm run deploy:vercel     # env + deploy de admin y web
```

Variables en ambos proyectos Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Admin también: `NEXT_PUBLIC_WEB_URL` (URL del portal).  
Portal también: `NEXT_PUBLIC_APP_URL`.

En Authentication de Supabase, Site URL = portal (o admin) y Redirect URLs de ambos dominios `/**`.
