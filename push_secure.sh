#!/usr/bin/env bash
# ECONEURA · Push seguro y verificado (NO_DEPLOY, 10 NEURA, smoke opcional)
set -euo pipefail; IFS=$'\n\t'
: "${REPO_URL:?Define REPO_URL=\"https://github.com/ORG/REPO.git\"}"

need(){ command -v "$1" >/dev/null || { echo "Falta $1"; exit 1; }; }
need git; need python3
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "No es repo git"; exit 1; }

# 1) Validaciones duras antes de push
grep -q 'DEPLOY_ENABLED:.*"false"' .github/workflows/ci.yml || { echo "ci.yml sin NO_DEPLOY"; exit 1; }
python3 - <<'PY'
import json,sys,os
p="packages/config/agent-routing.json"
print(f"Checking {p}", file=sys.stderr)
d=json.load(open(p)) if os.path.exists(p) else []
print(f"len(d): {len(d)}", file=sys.stderr)
ids = [x["id"] for x in d]
expected = [f"neura-{i}" for i in range(1,11)]
print(f"ids: {ids}", file=sys.stderr)
print(f"expected: {expected}", file=sys.stderr)
assert isinstance(d,list) and len(d)==10
assert ids == expected
assert all(set(r)=={"id","url","auth","keyEnv"} for r in d)
print("Validation passed", file=sys.stderr)
PY

# 2) Smoke local breve (opcional, no bloquea)
( python3 apps/api_py/server.py 3000 >/dev/null 2>&1 & echo $! > .api.pid )
for i in {1..40}; do curl -sf http://localhost:3000/api/health >/dev/null && break || sleep 0.2; done || true
for i in {1..10}; do curl -sf -XPOST http://localhost:3000/api/invoke/neura-$i \
 -H "Authorization: Bearer X" -H "X-Route: azure" -H "X-Correlation-Id: cid-$i" \
 -H "Content-Type: application/json" -d '{"input":""}' >/dev/null || true; done
kill "$(cat .api.pid 2>/dev/null)" 2>/dev/null || true; rm -f .api.pid

# 3) Evidencia y push
echo "ci,prepush,$(git rev-parse HEAD 2>/dev/null || echo NO_GIT),$(date -u +%FT%TZ)" >> WF_EVIDENCE.csv
git add -A
git diff --cached --quiet || git commit -m "ECONEURA: CI NO_DEPLOY verificado, routing 10 NEURA, API Python, evidencia"
git branch -M main
if git remote get-url origin >/dev/null 2>&1; then git remote set-url origin "$REPO_URL"; else git remote add origin "$REPO_URL"; fi
git push -u origin main

# 4) Resumen útil
echo ":: resumen ::"
echo "- Remoto: $(git remote get-url origin)"
echo "- Rama: $(git rev-parse --abbrev-ref HEAD)"
echo "- Commit: $(git rev-parse --short HEAD)"
echo "- CI esperado: jobs build_test y smoke_python con NO_DEPLOY activo"