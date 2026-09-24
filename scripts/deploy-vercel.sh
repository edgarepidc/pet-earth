#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f "$ROOT/.env" ]; then
  echo "Falta .env. Corre primero: bash scripts/create-supabase-project.sh"
  exit 1
fi

# shellcheck disable=SC1091
set -a
source "$ROOT/.env"
set +a

TEAM="${VERCEL_TEAM:-edgarepidcs-projects}"

add_env() {
  local project="$1"
  local key="$2"
  local value="$3"
  for env in production preview development; do
    printf '%s' "$value" | npx vercel env add "$key" "$env" --yes --force --scope "$TEAM" --project "$project" >/dev/null
  done
}

echo "→ Variables de entorno (admin + web)..."
for project in pet-earth-admin pet-earth-web; do
  add_env "$project" NEXT_PUBLIC_SUPABASE_URL "$NEXT_PUBLIC_SUPABASE_URL"
  add_env "$project" NEXT_PUBLIC_SUPABASE_ANON_KEY "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
  add_env "$project" SUPABASE_URL "$SUPABASE_URL"
  add_env "$project" SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY"
done

ADMIN_URL="${PE_ADMIN_URL:-https://admin.pet-earth.com.mx}"
WEB_URL="${PE_WEB_URL:-https://pet-earth.com.mx}"
add_env pet-earth-admin NEXT_PUBLIC_WEB_URL "$WEB_URL"
add_env pet-earth-admin NEXT_PUBLIC_ADMIN_URL "$ADMIN_URL"
add_env pet-earth-web NEXT_PUBLIC_APP_URL "$WEB_URL"
add_env pet-earth-web NEXT_PUBLIC_ADMIN_URL "$ADMIN_URL"

echo "→ Deploying admin..."
npx vercel deploy --prod --yes --scope "$TEAM" --project pet-earth-admin

echo "→ Deploying web..."
npx vercel deploy --prod --yes --scope "$TEAM" --project pet-earth-web

echo "Done."
echo "  Admin: $ADMIN_URL/login"
echo "  Web:   $WEB_URL/login"
