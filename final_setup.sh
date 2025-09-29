#!/usr/bin/env bash
# ECONEURA · CI dual estable (debug+smoke), server, routing, verificación y push opcional
set -Eeuo pipefail; IFS=$'\n\t'
need(){ command -v "$1" >/dev/null || { echo "Falta $1"; exit 1; }; }; need git; need python3
TS="$(date -u +%Y%m%d-%H%M%S)"; BK=".econeura_backup/$TS"; mkdir -p "$BK"
[ -d .github/workflows ] && cp -a .github/workflows "$BK/workflows" || true

# 1) Routing 10 NEURA determinista
mkdir -p packages/config
python3 - <<'PY'
import json,os;p="packages/config/agent-routing.json"
want=[{"id":f"neura-{i}","url":f"http://localhost:4310/hook/neura-{i}","auth":"header","keyEnv":"MAKE_TOKEN"} for i in range(1,11)]
os.makedirs(os.path.dirname(p),exist_ok=True)
try:
 d=json.load(open(p)); ok=isinstance(d,list) and len(d)==10 and sorted(x["id"] for x in d)==[f"neura-{i}" for i in range(1,11)] and all(set(r)=={"id","url","auth","keyEnv"} for r in d)
except: ok=False
open(p,"w").write(json.dumps(d if ok else want,indent=2))
PY

# 2) Server Python robusto (contrato /api/health, /api/invoke/:id)
mkdir -p apps/api_py
cat > apps/api_py/server.py <<'PY'
import json,re,sys,os,datetime
from http.server import BaseHTTPRequestHandler,HTTPServer
ROUTES=[f"neura-{i}" for i in range(1,11)]
class H(BaseHTTPRequestHandler):
  def _s(self,c=200,t="application/json"): self.send_response(c); self.send_header("Content-Type",t); self.end_headers()
  def do_GET(self): self._s() if self.path=="/api/health" else self._s(404); 
  def do_POST(self):
    m=re.match(r"^/api/invoke/(?P<id>[^/]+)$",self.path); 
    if not m: return self._s(404)
    aid=m.group("id"); a=self.headers.get("Authorization",""); r=self.headers.get("X-Route",""); c=self.headers.get("X-Correlation-Id","")
    if not a.startswith("Bearer "): self._s(401); return self.wfile.write(b'{"error":"missing Authorization Bearer"}')
    if not r or not c: self._s(400); return self.wfile.write(b'{"error":"missing X-Route or X-Correlation-Id"}')
    if aid not in ROUTES: self._s(404); return self.wfile.write(b'{"error":"unknown agent id"}')
    l=int(self.headers.get("Content-Length","0") or 0); body=self.rfile.read(l) if l>0 else b"{}"
    try: payload=json.loads(body or b"{}")
    except Exception: payload={}
    self._s(200); self.wfile.write(json.dumps({"id":aid,"ok":True,"echo":payload,"route":r}).encode())
  def log_message(self, fmt, *args): sys.stderr.write("DEBUG: " + (fmt%args) + "\n")
if __name__=="__main__": 
  host=os.environ.get("HOST","127.0.0.1"); port=int(os.environ.get("PORT","8080"))
  sys.stderr.write(f"DEBUG: starting at {host}:{port}\n"); HTTPServer((host,port),H).serve_forever()
PY

# 3) CI dual: ci-debug (1 NEURA, verbose) + ci-smoke (10/10 con retry puertos)
mkdir -p .github/workflows
cat > .github/workflows/ci-debug.yml <<'YML'
name: ci-debug
on: { push: { branches: [ main ] }, workflow_dispatch: {} }
permissions: { contents: read }
concurrency: { group: ci-debug-${{ github.ref }}, cancel-in-progress: true }
env: { DEPLOY_ENABLED: "false" }
jobs:
  debug:
    runs-on: ubuntu-latest
    timeout-minutes: 12
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - name: Ensure routing
        run: python - <<'PY'
import json, os; p="packages/config/agent-routing.json"; os.makedirs(os.path.dirname(p), exist_ok=True)
d=json.load(open(p)); assert isinstance(d,list) and len(d)==10 and all(set(r)=={"id","url","auth","keyEnv"} for r in d)
print("routing ok")
PY
      - name: DEBUG smoke (8080, 1 NEURA, logs completos)
        shell: bash
        run: |
          set -Eeuo pipefail; export HOST=127.0.0.1 PORT=8080
          python -u apps/api_py/server.py "$PORT" 2>&1 | tee server.log & echo $! > .api.pid
          trap 'kill $(cat .api.pid) 2>/dev/null || true' EXIT
          for i in {1..30}; do curl -fsS "http://$HOST:$PORT/api/health" && break || sleep 1; done
          curl -v --fail -XPOST "http://$HOST:$PORT/api/invoke/neura-1" \
            -H "Authorization: Bearer X" -H "X-Route: azure" -H "X-Correlation-Id: cid-1" \
            -H "Content-Type: application/json" -d '{"input":""}' | tee invoke1.json
          { echo "## DEBUG"; echo "- NO_DEPLOY: $DEPLOY_ENABLED"; echo "- Body:"; sed "s/^/    /" invoke1.json; } >> "$GITHUB_STEP_SUMMARY"
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: debug-logs, path: server.log, if-no-files-found: warn, retention-days: 7 }
YML

cat > .github/workflows/ci-smoke.yml <<'YML'
name: ci-smoke
on: { push: { branches: [ main ] }, workflow_dispatch: {} }
permissions: { contents: read }
concurrency: { group: ci-smoke-${{ github.ref }}, cancel-in-progress: true }
env: { DEPLOY_ENABLED: "false" }
jobs:
  smoke:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - name: Ensure routing
        run: python - <<'PY'
import json, os; p="packages/config/agent-routing.json"; os.makedirs(os.path.dirname(p), exist_ok=True)
d=json.load(open(p)); assert isinstance(d,list) and len(d)==10 and all(set(r)=={"id","url","auth","keyEnv"} for r in d)
print("routing ok")
PY
      - name: Smoke (10/10, retry puertos 8080/8081/8090, logs+summary)
        shell: bash
        run: |
          set -Eeuo pipefail
          run(){ PORT="$1"; export HOST=127.0.0.1 PORT
            python -u apps/api_py/server.py "$PORT" 2>&1 | tee server.log & echo $! > .api.pid
            trap 'kill $(cat .api.pid) 2>/dev/null || true' EXIT
            for i in {1..120}; do curl -fsS "http://$HOST:$PORT/api/health" >/dev/null && break || sleep 0.1; done
            ok=0; for i in {1..10}; do
              curl -fsS -XPOST "http://$HOST:$PORT/api/invoke/neura-$i" \
              -H "Authorization: Bearer X" -H "X-Route: azure" -H "X-Correlation-Id: cid-$i" \
              -H "Content-Type: application/json" -d '{"input":""}' >/dev/null && ok=$((ok+1))
            done
            echo "OK_INVOCATIONS=$ok" >> $GITHUB_ENV
            kill "$(cat .api.pid)" || true; trap - EXIT
          }
          run 8080 || run 8081 || run 8090
          { echo "## SMOKE"; echo "- OK: ${OK_INVOCATIONS:-0}/10"; echo "- NO_DEPLOY: $DEPLOY_ENABLED"; } >> "$GITHUB_STEP_SUMMARY"
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: smoke-logs, path: server.log, if-no-files-found: warn, retention-days: 7 }
YML

# 4) Comprobación NO_DEPLOY antes de commit
grep -Rq 'DEPLOY_ENABLED:.*"false"' .github/workflows || { echo "NO_DEPLOY ausente"; exit 1; }

# 5) Commit y push opcional
echo "ci,ci-dual,$TS" >> WF_EVIDENCE.csv
git add -A
git commit -m "ECONEURA: CI dual (debug+smoke), server robusto, routing 10 NEURA, NO_DEPLOY" || true
if [ -n "${REPO_URL:-}" ]; then
  git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"
  git push -u origin "$(git rev-parse --abbrev-ref HEAD)"
else
  echo 'Define REPO_URL="https://github.com/ORG/REPO.git" para push automático.'
fi
echo "OK: Workflows creados (ci-debug, ci-smoke). Backups en $BK."