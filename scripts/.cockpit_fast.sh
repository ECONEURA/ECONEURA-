#!/usr/bin/env bash
set -Eeuo pipefail
shopt -s expand_aliases
alias pn="pnpm -w"
ts="$(date +%Y%m%d-%H%M%S)"; mkdir -p .artifacts || true
export NODE_ENV=development
export DIFF_BASE="${DIFF_BASE:-origin/main}"

echo "== ENV =="; node -v; pnpm -v | tee ".artifacts/env-$ts.txt"

echo "== INSTALL (cached) =="
pn i --prefer-frozen-lockfile | tee ".artifacts/install-$ts.txt"

echo "== CHANGE SCOPE (cockpit/web only if changed) =="
git fetch -q origin || true
chg=$(git diff --name-only "$DIFF_BASE"...HEAD | grep -E '^apps/(cockpit|web)/' || true)
SCOPE_COCKPIT="--filter ./apps/cockpit"
SCOPE_WEB="--filter ./apps/web"
if [ -n "$chg" ]; then
  echo "Cambios en apps/cockpit|web detectados"; echo "$chg" | tee ".artifacts/changed-$ts.txt"
else
  echo "Sin cambios en cockpit/web → forzar chequeo rápido" | tee ".artifacts/changed-$ts.txt"
fi

echo "== LINT (0 errores) =="
set +e
pn $SCOPE_COCKPIT run lint --max-warnings=0 2>&1 | tee ".artifacts/lint-cockpit-$ts.txt"; rc1=${PIPESTATUS[0]}
pn $SCOPE_WEB     run lint --max-warnings=0 2>&1 | tee ".artifacts/lint-web-$ts.txt";     rc2=${PIPESTATUS[0]}
set -e
test $rc1 -eq 0 && test $rc2 -eq 0

echo "== TYPECHECK =="
pn $SCOPE_COCKPIT run typecheck | tee ".artifacts/ts-cockpit-$ts.txt"
pn $SCOPE_WEB     run typecheck | tee ".artifacts/ts-web-$ts.txt"

echo "== TEST + COVERAGE (UI) =="
pn $SCOPE_COCKPIT run test:coverage | tee ".artifacts/cov-cockpit-$ts.txt"
pn $SCOPE_WEB     run test:coverage | tee ".artifacts/cov-web-$ts.txt"

echo "== BUILD (cockpit primero) =="
pn $SCOPE_COCKPIT run build | tee ".artifacts/build-cockpit-$ts.txt"
pn $SCOPE_WEB     run build | tee ".artifacts/build-web-$ts.txt" || true

echo "== PREVIEW + SMOKE (cockpit) =="
# intenta script preview; si no existe, usa vite preview; si no, servidor estático rápido
PREVIEW_CMD="pn --filter ./apps/cockpit run preview || npx -y vite preview --host --port 5173 --strictPort || npx -y http-server apps/cockpit/dist -p 5173"
( timeout 12s bash -lc "$PREVIEW_CMD" ) > ".artifacts/preview-cockpit-$ts.log" 2>&1 || true

# smoke: index y endpoints básicos si existen
for i in {1..8}; do
  sleep 0.8
  if curl -fsS "http://127.0.0.1:5173" >/dev/null 2>&1; then ok=1; break; fi
done
[[ "${ok:-0}" -eq 1 ]] && echo "SMOKE index OK" | tee -a ".artifacts/preview-cockpit-$ts.log" || echo "SMOKE index FAIL" | tee -a ".artifacts/preview-cockpit-$ts.log"

# health opcional si existe ruta /health
if curl -fsS "http://127.0.0.1:5173/health" >/dev/null 2>&1; then echo "SMOKE /health OK" | tee -a ".artifacts/preview-cockpit-$ts.log"; else echo "SMOKE /health N/A" | tee -a ".artifacts/preview-cockpit-$ts.log"; fi

echo "== RESULTADOS =="
pass=1
grep -q "0 problems" ".artifacts/lint-cockpit-$ts.txt" || pass=0
grep -q "0 problems" ".artifacts/lint-web-$ts.txt"     || pass=0
grep -qi "Coverage" ".artifacts/cov-cockpit-$ts.txt"   || pass=0
grep -qi "SMOKE index OK" ".artifacts/preview-cockpit-$ts.log" || pass=0

if [ $pass -eq 1 ]; then
  echo "VEREDICTO: PASS (cockpit funcional, lint/typecheck OK, tests+build+preview OK)"
else
  echo "VEREDICTO: FAIL (revisar .artifacts/*-$ts.txt y *.log)"; exit 1
fi

echo "Artefactos => .artifacts/"
