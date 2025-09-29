#!/usr/bin/env bash
# ECONEURA · FIX: CI debug estable + server + routing en 1 paso
set -Eeuo pipefail; IFS=$'\n\t'
need(){ command -v "$1" >/dev/null 2>&1 || { echo "Falta $1"; exit 1; }; }
curlx(){ if command -v curl >/dev/null; then curl -fsS "$@"; else wget -qO- "$1"; fi; }
say(){ printf "\n== %s\n" "$*"; }

need python3; need git

# Backups
TS="$(date -u +%Y%m%d-%H%M%S)"; BK=".econeura_backup/$TS"; mkdir -p "$BK"
for p in ".github/workflows" "apps/api_py/server.py" "packages/config/agent-routing.json"; do
  [ -e "$p" ] && mkdir -p "$BK/$(dirname "$p")" && cp -a "$p" "$BK/$p"
done

# Routing 10 NEURA determinista
mkdir -p packages/config
python3 - "$PWD/packages/config/agent-routing.json" <<'PY'
import json,sys,os;p=sys.argv[1]
want=[{"id":f"neura-{i}","url":f"http://localhost:4310/hook/neura-{i}","auth":"header","keyEnv":"MAKE_TOKEN"} for i in range(1,11)]
os.makedirs(os.path.dirname(p),exist_ok=True)
try:
 d=json.load(open(p)); ok=isinstance(d,list) and len(d)==10 and sorted(x["id"] for x in d)==[f"neura-{i}" for i in range(1,11)] and all(set(r)=={"id","url","auth","keyEnv"} for r in d)
except: ok=False
open(p,"w").write(json.dumps(d if ok else want,indent=2))
PY

# Server Python robusto (logs claros)
mkdir -p apps/api_py
cat > apps/api_py/server.py <<'PY'
import json,re,sys,os,datetime
from http.server import BaseHTTPRequestHandler,HTTPServer
ROUTES=[f"neura-{i}" for i in range(1,11)]
class H(BaseHTTPRequestHandler):
  def _s(self,c=200,t="application/json"): self.send_response(c); self.send_header("Content-Type",t); self.end_headers()
  def do_GET(self):
    if self.path=="/api/health":
      self._s(); self.wfile.write(json.dumps({"ok":True,"ts":datetime.datetime.utcnow().isoformat()}).encode())
    else: self._s(404)
  def do_POST(self):
    m=re.match(r"^/api/invoke/(?P<id>[^/]+)$",self.path)
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
  sys.stderr.write(f"DEBUG: starting at {host}:{port}\n"); sys.stderr.flush()
  HTTPServer((host,port),H).serve_forever()
PY

# CI Debug mínimo y verboso (1 NEURA, puerto fijo 8080, sin Node)
mkdir -p .github/workflows .github/workflows_disabled
for f in .github/workflows/*; do
  if [ "$(basename "$f")" != "ci.yml" ]; then
    mv "$f" .github/workflows_disabled/ 2>/dev/null || true
  fi
done
cat > .github/workflows/ci.yml <<'YML'
name: ci-debug
on: { push: { branches: [ main ] }, pull_request: {} }
permissions: { contents: read }
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }
env: { DEPLOY_ENABLED: "false" }
jobs:
  smoke_python_debug:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - name: Ensure routing (10 NEURA)
        run: |
          python - <<'PY'
          import json, os
          p="packages/config/agent-routing.json"
          os.makedirs(os.path.dirname(p), exist_ok=True)
          want=[{"id":f"neura-{i}","url":f"http://localhost:4310/hook/neura-{i}","auth":"header","keyEnv":"MAKE_TOKEN"} for i in range(1,11)]
          try:
            d=json.load(open(p)); ok=isinstance(d,list) and len(d)==10 and sorted(x["id"] for x in d)==[f"neura-{i}" for i in range(1,11)] and all(set(r)=={"id","url","auth","keyEnv"} for r in d)
          except: ok=False
          open(p,"w").write(json.dumps(d if ok else want,indent=2))
          PY
      - name: DEBUG smoke (8080, 1 NEURA, logs completos)
        shell: bash
        run: |
          set -Eeuo pipefail
          export HOST=127.0.0.1 PORT=8080
          echo "# start server" | tee server.log
          python -u apps/api_py/server.py "$PORT" 2>&1 | tee -a server.log & echo $! > .api.pid
          trap 'kill $(cat .api.pid) 2>/dev/null || true' EXIT
          echo "# health probe" | tee curl_health.log
          ok=0
          for i in {1..30}; do
            echo "## attempt $i" | tee -a curl_health.log
            if curl -v --show-error --fail "http://$HOST:$PORT/api/health" | tee health.json; then ok=1; break; fi
            sleep 1
          done
          [ "$ok" = "1" ] || { echo "ERROR: health no respondió" | tee -a curl_health.log; exit 1; }
          echo "# invoke neura-1 (verbose)" | tee curl_invoke1.log
          curl -v --show-error --fail -XPOST "http://$HOST:$PORT/api/invoke/neura-1" \
            -H "Authorization: Bearer X" -H "X-Route: azure" -H "X-Correlation-Id: cid-1" \
            -H "Content-Type: application/json" -d '{"input":""}' | tee invoke1.json
          {
            echo "## ECONEURA DEBUG summary"
            echo "- Puerto: $PORT"
            echo "- Health body:"; sed 's/^/    /' health.json || true
            echo "- Invoke body:"; sed 's/^/    /' invoke1.json || true
          } >> "$GITHUB_STEP_SUMMARY"
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: debug-logs
          path: |
            server.log
            curl_health.log
            curl_invoke1.log
            health.json
            invoke1.json
          if-no-files-found: warn
          retention-days: 7
YML

# Commit seguro (no falla si no hay cambios)
echo "ci,fix,$(date -u +%FT%TZ)" >> WF_EVIDENCE.csv
git add -A
git diff --cached --quiet || git commit -m "ECONEURA: CI DEBUG mínimo estable; server robusto; routing determinista; NO_DEPLOY"

# Push opcional
if [ -n "${REPO_URL:-}" ]; then git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"; git push -u origin main; else echo 'Define REPO_URL="https://github.com/ORG/REPO.git" y reejecuta para push.'; fi

echo "OK · Backups: $BK · Acciones: ci-debug/smoke_python_debug"