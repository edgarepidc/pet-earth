# Despliegue en Vercel + Supabase

Producción:

- Supabase: [pet-earth-prod](https://supabase.com/dashboard/project/uhqybgptqhaycrkhqxnp) (`uhqybgptqhaycrkhqxnp`, `us-east-1`)
- Portal (tutores): https://pet-earth.com.mx (proyecto `pet-earth-web`, root `apps/web`)
- Panel (clínica): https://admin.pet-earth.com.mx (proyecto `pet-earth-admin`, root `apps/admin`)
- `www.pet-earth.com.mx` redirige al portal

Dominio en Hostinger. En el editor DNS deja los nameservers de Hostinger y pon:

| Tipo | Nombre | Valor |
|------|--------|--------|
| A | `@` | `216.198.79.1` |
| A | `@` | `64.29.17.1` |
| CNAME | `www` | `bb2aebb6ff20ac4c.vercel-dns-017.com` |
| CNAME | `admin` | `574a5e0637b75315.vercel-dns-017.com` |

Quita el A de parking (`2.57.91.91`) y el CNAME de `www` que apunta al mismo dominio. No toques MX si usas correo de Hostinger.

En Authentication de Supabase: Site URL = `https://pet-earth.com.mx` y Redirect URLs `https://pet-earth.com.mx/**`, `https://admin.pet-earth.com.mx/**`.

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
- `NEXT_PUBLIC_ADMIN_URL` (`https://admin.pet-earth.com.mx`)

Admin también: `NEXT_PUBLIC_WEB_URL` (portal).  
Portal también: `NEXT_PUBLIC_APP_URL` (portal).
