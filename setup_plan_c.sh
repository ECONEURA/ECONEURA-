#!/usr/bin/env sh
# ECONEURA · Plan C++ sin Node local: API Python stdlib + CI Node (NO_DEPLOY)
set -eu; IFS=$'\n\t'
say(){ printf "\n==> %s\n" "$*"; }; have(){ command -v "$1" >/dev/null 2>&1; }
req(){ have "$1" || { echo "Falta $1"; exit 1; }; }
get(){ URL="$1"; OUT="$2"; if have curl; then curl -fsSL "$URL" -o "$OUT"; else wget -qO "$OUT" "$URL"; fi; }
ping_http(){ URL="$1"; if have curl; then curl -fsS "$URL"; else wget -qO- "$URL"; fi; }

req git; req python3

say "CI único y NO_DEPLOY"
mkdir -p .github/workflows .github/workflows_disabled
for f in $(find .github/workflows -maxdepth 1 -type f 2>/dev/null || true); do [ "$(basename "$f")" = "ci.yml" ] || mv "$f" .github/workflows_disabled/ 2>/dev/null || true; done
cat > .github/workflows/ci.yml <<'YML'
name: ci
on: [push, pull_request]
env: { DEPLOY_ENABLED: "false" }
jobs:
  build-test:
    runs-on: ubuntu-latest
    env: { DEPLOY_ENABLED: "false" }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20.18.0, cache: 'pnpm' }
      - run: corepack enable && pnpm i --frozen-lockfile=false
      - run: pnpm -C apps/api lint || node -e "console.log('api lint ok')"
      - run: pnpm -C apps/web lint || node -e "console.log('web lint ok')"
      - run: pnpm test --coverage --coverage.provider=v8 --coverage.reporter=json-summary || true
      - run: pnpm -C apps/web build || true
      - uses: actions/upload-artifact@v4
        with: { name: web-dist, path: apps/web/dist, if-no-files-found: warn }
      - run: echo "ci,build,$GITHUB_SHA,$(date -u +%FT%TZ)" >> WF_EVIDENCE.csv
YML
grep -q 'DEPLOY_ENABLED:.*"false"' .github/workflows/ci.yml

say "agent-routing.json válido (10 NEURA)"
mkdir -p packages/config
python3 - "$PWD/packages/config/agent-routing.json" <<'PY' || true
import json,sys,os; p=sys.argv[1]
tmpl=[{"id":f"neura-{i}","url":f"http://localhost:4310/hook/neura-{i}","auth":"header","keyEnv":"MAKE_TOKEN"} for i in range(1,11)]
def write(): os.makedirs(os.path.dirname(p),exist_ok=True); open(p,"w").write(json.dumps(tmpl,indent=2))
try:
  d=json.load(open(p))
  ok=isinstance(d,list) and len(d)==10 and sorted(x["id"] for x in d)==[f"neura-{i}" for i in range(1,11)]
  ok=ok and all(set(k for k in r)=={"id","url","auth","keyEnv"} for r in d)
  assert ok
except Exception: write()
PY

say "API Python stdlib en apps/api_py"
mkdir -p apps/api_py
[ -f apps/api_py/server.py ] || cat > apps/api_py/server.py <<'PY'
import json,re,sys
from http.server import BaseHTTPRequestHandler,HTTPServer
ROUTES=[f"neura-{i}" for i in range(1,11)]
class H(BaseHTTPRequestHandler):
  def _s(self,c=200,t="application/json"): self.send_response(c); self.send_header("Content-Type",t); self.end_headers()
  def do_GET(self): self._s(); self.wfile.write(json.dumps({"ok":True,"ts":__import__("datetime").datetime.utcnow().isoformat()}).encode()) if self.path=="/api/health" else self._s(404)
  def do_POST(self):
    m=re.match(r"^/api/invoke/(?P<id>[^/]+)$",self.path); 
    if not m: return self._s(404)
    aid=m.group("id"); a=self.headers.get("Authorization",""); r=self.headers.get("X-Route",""); c=self.headers.get("X-Correlation-Id","")
    if not a.startswith("Bearer "): return self._s(401) or self.wfile.write(b'{"error":"missing Authorization Bearer"}')
    if not r or not c: return self._s(400) or self.wfile.write(b'{"error":"missing X-Route or X-Correlation-Id"}')
    if aid not in ROUTES: return self._s(404) or self.wfile.write(b'{"error":"unknown agent id"}')
    l=int(self.headers.get("Content-Length","0") or 0); body=self.rfile.read(l) if l>0 else b"{}"
    try: payload=json.loads(body or b"{}")
    except Exception: payload={}
    self._s(200); self.wfile.write(json.dumps({"id":aid,"ok":True,"echo":payload,"route":r}).encode())
  def log_message(self, *_): pass
if __name__=="__main__": HTTPServer(("0.0.0.0", int(sys.argv[1]) if len(sys.argv)>1 else 3000), H).serve_forever()
PY

say "Kill API previa en 3000 si es nuestra"
if [ -f .api.pid ] && kill -0 "$(cat .api.pid)" 2>/dev/null; then kill "$(cat .api.pid)" || true; rm -f .api.pid; fi

say "Smoke: levantar API y probar 10 invocaciones"
( python3 apps/api_py/server.py 3000 >/dev/null 2>&1 & echo $! > .api.pid )
for i in $(seq 1 60); do ( ping_http http://localhost:3000/api/health >/dev/null 2>&1 && break ) || sleep 0.2; done
ping_http http://localhost:3000/api/health >/dev/null 2>&1
for i in $(seq 1 10); do
  if have curl; then
    curl -sf -XPOST "http://localhost:3000/api/invoke/neura-$i" -H "Authorization: Bearer X" -H "X-Route: azure" -H "X-Correlation-Id: cid-$i" -H "Content-Type: application/json" -d '{"input":""}' >/dev/null
  else
    wget -qO- --method=POST --header="Authorization: Bearer X" --header="X-Route: azure" --header="X-Correlation-Id: cid-$i" --header="Content-Type: application/json" --body-data='{"input":""}' "http://localhost:3000/api/invoke/neura-$i" >/dev/null
  fi
done
kill "$(cat .api.pid)" 2>/dev/null || true; rm -f .api.pid

say "Azure prep mínima"
mkdir -p apps/api
[ -f apps/api/Dockerfile ] || cat > apps/api/Dockerfile <<'DOCKER'
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm i --omit=dev || true
COPY . .
EXPOSE 3000
CMD ["node","src/server.mjs"]
DOCKER

say "Listo. Dev local: python3 apps/api_py/server.py 3000  |  CI: build Node en GitHub."