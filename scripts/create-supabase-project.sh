#!/usr/bin/env bash
# Crea el proyecto Supabase de Pet Earth, aplica migraciones y seed.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_NAME="${PE_SUPABASE_PROJECT_NAME:-pet-earth-prod}"
REGION="${PE_SUPABASE_REGION:-us-east-1}"

echo "==> Pet Earth — Crear proyecto Supabase"
echo ""

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ] && [ -f "$HOME/.supabase/access-token" ]; then
  export SUPABASE_ACCESS_TOKEN="$(cat "$HOME/.supabase/access-token")"
fi

ORGS_JSON="$(npx supabase orgs list -o json)"
ORG_ID="${PE_SUPABASE_ORG_ID:-}"
if [ -z "$ORG_ID" ]; then
  ORG_ID="$(echo "$ORGS_JSON" | node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync(0, 'utf8'));
    const orgs = Array.isArray(data) ? data : data.organizations ?? [];
    const vercel = orgs.find(o => String(o.id).startsWith('vercel_'));
    console.log((vercel || orgs[0] || {}).id || '');
  ")"
fi

if [ -z "$ORG_ID" ]; then
  echo "No se encontró organización en Supabase."
  exit 1
fi

if [ -z "${SUPABASE_DB_PASSWORD:-}" ]; then
  SUPABASE_DB_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
fi

echo "→ Creando proyecto '$PROJECT_NAME'..."
CREATE_OUT="$(npx supabase projects create "$PROJECT_NAME" \
  --org-id "$ORG_ID" \
  --db-password "$SUPABASE_DB_PASSWORD" \
  --region "$REGION" \
  -o json 2>&1)" || true

PROJECT_REF="$(echo "$CREATE_OUT" | node -e "
  const fs = require('fs');
  const input = fs.readFileSync(0, 'utf8');
  try {
    const data = JSON.parse(input);
    console.log(data.id || data.ref || '');
  } catch {
    const m = input.match(/[a-z]{20}/);
    if (m) console.log(m[0]);
  }
" 2>/dev/null || true)"

if [ -z "$PROJECT_REF" ]; then
  PROJECT_REF="$(npx supabase projects list -o json | node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync(0, 'utf8'));
    const projects = Array.isArray(data) ? data : data.projects ?? [];
    const p = projects.find(x => (x.name || '').includes('pet-earth')) || null;
    if (p) console.log(p.id || p.ref);
  ")"
fi

if [ -z "$PROJECT_REF" ]; then
  echo "$CREATE_OUT"
  echo "No se pudo crear o encontrar el proyecto Supabase."
  exit 1
fi

echo "✓ Proyecto: $PROJECT_REF"
echo "→ Esperando a que el API esté listo..."
for i in 1 2 3 4 5 6 7 8; do
  if npx supabase projects api-keys --project-ref "$PROJECT_REF" -o json >/tmp/pe-supabase-keys.json 2>/dev/null; then
    break
  fi
  sleep 15
done

KEYS_JSON="$(cat /tmp/pe-supabase-keys.json)"
rm -f /tmp/pe-supabase-keys.json
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
ANON_KEY="$(echo "$KEYS_JSON" | node -e "
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync(0, 'utf8'));
  const keys = Array.isArray(data) ? data : data.api_keys ?? [];
  const anon = keys.find(k => k.name === 'anon' || k.type === 'anon');
  console.log(anon?.api_key || anon?.key || '');
")"
SERVICE_KEY="$(echo "$KEYS_JSON" | node -e "
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync(0, 'utf8'));
  const keys = Array.isArray(data) ? data : data.api_keys ?? [];
  const svc = keys.find(k => k.name === 'service_role' || k.type === 'service_role');
  console.log(svc?.api_key || svc?.key || '');
")"

cat > "$ROOT/.env" <<EOF
SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$ANON_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY
SUPABASE_DB_PASSWORD=$SUPABASE_DB_PASSWORD
SUPABASE_PROJECT_REF=$PROJECT_REF
EOF

cat > "$ROOT/apps/web/.env.local" <<EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3001
EOF

cat > "$ROOT/apps/admin/.env.local" <<EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY
NEXT_PUBLIC_WEB_URL=http://localhost:3001
EOF

npx supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD" --yes
npx supabase db push --yes
npx supabase db query -f "$ROOT/supabase/seed.sql" --linked || \
  psql "postgresql://postgres.${PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres" -f "$ROOT/supabase/seed.sql" || true

echo ""
echo "✅ Supabase listo: https://supabase.com/dashboard/project/$PROJECT_REF"
echo "   Siguiente: bash scripts/deploy-vercel.sh"
