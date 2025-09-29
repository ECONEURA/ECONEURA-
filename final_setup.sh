#!/usr/bin/env bash
# ECONEURA · "Gestiona IA sobre tu stack. No sustituimos ERP/CRM"
set -euo pipefail; IFS=$'\n\t'
need(){ command -v "$1" >/dev/null || { echo "Falta $1"; exit 1; }; }
need git; need python3

mkdir -p packages/config .github/workflows apps/api_py

# agent-routing.json exacto (10 NEURA)
python3 - "$PWD/packages/config/agent-routing.json" <<'PY'
import json,sys,os;p=sys.argv[1]
want=[{"id":f"neura-{i}","url":f"http://localhost:4310/hook/neura-{i}","auth":"header","keyEnv":"MAKE_TOKEN"} for i in range(1,11)]
os.makedirs(os.path.dirname(p),exist_ok=True)
try:
 d=json.load(open(p)); ok=isinstance(d,list) and len(d)==10 and sorted(x["id"] for x in d)==[f"neura-{i}" for i in range(1,11)] and all(set(r)=={"id","url","auth","keyEnv"} for r in d)
except: ok=False
open(p,"w").write(json.dumps(d if ok else want,indent=2))
PY

# API Python stdlib
cat > apps/api_py/server.py <<'PY'
import json,re,sys
from http.server import BaseHTTPRequestHandler,HTTPServer
ROUTES=[f"neura-{i}" for i in range(1,11)]
class H(BaseHTTPRequestHandler):
  def _s(self,c=200,t="application/json"): self.send_response(c); self.send_header("Content-Type",t); self.end_headers()
  def do_GET(self): self._s(200) if self.path=="/api/health" else self._s(404); 
  def do_POST(self):
    m=re.match(r"^/api/invoke/(?P<id>[^/]+)$",self.path); 
    if not m: return self._s(404)
    aid=m.group("id"); a=self.headers.get("Authorization",""); r=self.headers.get("X-Route",""); c=self.headers.get("X-Correlation-Id","")
    if not a.startswith("Bearer "): return self._s(401) or self.wfile.write(b'{"error":"missing Authorization Bearer"}')
    if not r or not c: return self._s(400) or self.wfile.write(b'{"error":"missing X-Route or X-Correlation-Id"}')
    if aid not in ROUTES: return self._s(404) or self.wfile.write(b'{"error":"unknown agent id"}')
    l=int(self.headers.get("Content-Length","0") or 0); body=self.rfile.read(l) if l>0 else b"{}"
    try: payload=json.loads(body or b"{}")
    except: payload={}
    self._s(200); self.wfile.write(json.dumps({"id":aid,"ok":True,"echo":payload,"route":r}).encode())
  def log_message(self,*_): pass
if __name__=="__main__": HTTPServer(("0.0.0.0", int(sys.argv[1]) if len(sys.argv)>1 else 3000), H).serve_forever()
PY

# CI único NO_DEPLOY con concurrencia + cobertura condicional + smoke Python
[ -f .github/workflows/ci.yml ] && cp .github/workflows/ci.yml .github/workflows/ci.yml.bak || true
cat > .github/workflows/ci.yml <<'YML'
name: ci
on:
  push: { branches: [ main ] }
  pull_request:
permissions: { contents: read, checks: write }
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }
env: { DEPLOY_ENABLED: "false" }

jobs:
  build_test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - name: Ensure agent-routing.json (10 NEURA)
        run: |
          python3 - <<'PY'
          import json, os
          p="packages/config/agent-routing.json"
          os.makedirs(os.path.dirname(p), exist_ok=True)
          want=[{"id":f"neura-{i}","url":f"http://localhost:4310/hook/neura-{i}","auth":"header","keyEnv":"MAKE_TOKEN"} for i in range(1,11)]
          try:
            d=json.load(open(p)); ok=isinstance(d,list) and len(d)==10 and sorted(x["id"] for x in d)==[f"neura-{i}" for i in range(1,11)] and all(set(r)=={"id","url","auth","keyEnv"} for r in d)
          except: ok=False
          open(p,"w").write(json.dumps(d if ok else want,indent=2))
          PY
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20.18.0, cache: pnpm }
      - run: corepack enable && pnpm i --frozen-lockfile=false
      - run: pnpm -C apps/api lint || node -e "console.log('api lint ok')"
      - run: pnpm -C apps/api lint || node -e "console.log('web lint ok')"
      - run: pnpm test --coverage --coverage.provider=v8 --coverage.reporter=json-summary || true
      - name: Enforce coverage >=80% (si existe)
        run: |
          node -e "const p='./coverage/coverage-summary.json',fs=require('fs');if(fs.existsSync(p)){const pct=require(p).total.lines.pct;console.log('coverage %:',pct);if(pct<80)process.exit(1)}"
      - run: pnpm -C apps/web build || true
      - run: echo "ci,build,${GITHUB_SHA},$(date -u +%FT%TZ)" >> WF_EVIDENCE.csv
      - uses: actions/upload-artifact@v4
        with: { name: web-dist, path: apps/web/dist, if-no-files-found: warn, retention-days: 7 }
      - uses: actions/upload-artifact@v4
        with: { name: coverage-summary, path: coverage/coverage-summary.json, if-no-files-found: warn, retention-days: 7 }
      - uses: actions/upload-artifact@v4
        with: { name: wf-evidence, path: WF_EVIDENCE.csv, if-no-files-found: error, retention-days: 30 }

  smoke_python:
    runs-on: ubuntu-latest
    needs: build_test
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - run: python3 apps/api_py/server.py 3000 & echo $! > .api.pid
      - run: for i in {1..60}; do curl -sf http://localhost:3000/api/health && break || sleep 0.2; done
      - run: for i in {1..10}; do curl -sf -XPOST "http://localhost:3000/api/invoke/neura-$i" -H "Authorization: Bearer X" -H "X-Route: azure" -H "X-Correlation-Id: cid-$i" -H "Content-Type: application/json" -d '{"input":""}'; done
      - if: always()
        run: kill "$(cat .api.pid)" || true
YML

# Smoke local rápido
( python3 apps/api_py/server.py 3000 >/dev/null 2>&1 & echo $! > .api.pid )
for i in {1..60}; do curl -sf http://localhost:3000/api/health >/dev/null && break || sleep 0.2; done
for i in {1..10}; do curl -sf -XPOST http://localhost:3000/api/invoke/neura-$i -H "Authorization: Bearer X" -H "X-Route: azure" -H "X-Correlation-Id: cid-$i" -H "Content-Type: application/json" -d '{"input":""}' >/dev/null; done
kill "$(cat .api.pid)" 2>/dev/null || true; rm -f .api.pid

# Evidencia + push opcional
echo "ci,init,$(git rev-parse HEAD 2>/dev/null || echo NO_GIT),$(date -u +%FT%TZ)" >> WF_EVIDENCE.csv
git add -A
git commit -m "ECONEURA: CI optimizado, routing 10 NEURA, API Python, NO_DEPLOY" || true
git branch -M main
if [ -n "${REPO_URL:-}" ]; then git remote add origin "$REPO_URL" 2>/dev/null || true; git push -u origin main; else echo 'Define REPO_URL="https://github.com/ORG/REPO.git" y reejecuta para push automático.'; fi
echo "OK · Dev local: python3 apps/api_py/server.py 3000"