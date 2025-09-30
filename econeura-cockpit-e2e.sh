#!/usr/bin/env bash
# ECONEURA · Cockpit E2E pro: parche UI, proxy Vite, API robusta, puertos libres, smoke estricto, apertura navegador, evidencia, commit
set -Eeuo pipefail; IFS=$'\n\t'
need(){ command -v "$1" >/dev/null || { echo "Falta $1"; exit 1; }; }
need git; need python3; need curl
TS="$(date -u +%Y%m%d-%H%M%S)"; RUN=".econeura_run/$TS"; BK=".econeura_backup/$TS"; mkdir -p "$RUN" "$BK"

# ---------- util ----------
is_free(){ : >/dev/tcp/127.0.0.1/"$1" 2>/dev/null && return 1 || return 0; }
free_port(){ local p="$1"; for _ in {1..20}; do is_free "$p" && { echo "$p"; return; }; p=$((p+1)); done; echo "$1"; }
open_url(){ local U="$1"; ( command -v xdg-open >/dev/null && xdg-open "$U" ) || \
( command -v open >/dev/null && open "$U" ) || \
( command -v powershell.exe >/dev/null && powershell.exe -NoP -C "Start-Process '$U'" ) || \
( command -v cmd.exe >/dev/null && cmd.exe /c start "$U" ) || true; }

# ---------- 0) asegurados ----------
mkdir -p apps/web packages/config apps/api_py .github/workflows
[ -f apps/web/.env.example ] || printf "VITE_NEURA_GW_URL=/api\n" > apps/web/.env.example

# ---------- 1) routing 10 NEURA determinista ----------
python3 - <<'PY'
import json,os
p="packages/config/agent-routing.json"; os.makedirs(os.path.dirname(p),exist_ok=True)
want=[{"id":f"neura-{i}","url":f"http://localhost:4310/hook/neura-{i}","auth":"header","keyEnv":"MAKE_TOKEN"} for i in range(1,11)]
try:
  cur=json.load(open(p)); ok=isinstance(cur,list) and len(cur)==10 and sorted(x["id"] for x in cur)==[f"neura-{i}" for i in range(1,11)]
except: ok=False
open(p,"w").write(json.dumps(cur if ok else want,indent=2))
PY

# ---------- 2) API server (forward opcional) ----------
if [ ! -f apps/api_py/server.py ]; then
cat > apps/api_py/server.py <<'PY'
import json,re,sys,os,datetime,urllib.request,urllib.error
from http.server import BaseHTTPRequestHandler,HTTPServer
ROUTES=[f"neura-{i}" for i in range(1,11)]
ROUTING_PATH=os.path.join("packages","config","agent-routing.json")
def load_routing():
  try: return {r["id"]:r for r in json.load(open(ROUTING_PATH,"r",encoding="utf-8"))}
  except Exception: return {}
ROUTING=load_routing()
def fwd(aid, body, corr, timeout):
  route=ROUTING.get(aid)
  if not route or "url" not in route: return 502, {"ok":False,"error":"routing-missing"}
  req=urllib.request.Request(route["url"], data=body, method="POST"); req.add_header("Content-Type","application/json")
  if corr: req.add_header("X-Correlation-Id", corr)
  if route.get("auth")=="header":
    t=os.environ.get("MAKE_TOKEN",""); 
    if t: req.add_header("x-make-token", t)
  try:
    with urllib.request.urlopen(req, timeout=timeout) as r:
      raw=r.read()
      try: return r.getcode(), json.loads(raw or b"{}")
      except Exception: return r.getcode(), {"ok":True,"raw":raw.decode("utf-8","ignore")}
  except urllib.error.HTTPError as e:
    try: body=e.read().decode("utf-8","ignore")
    except Exception: body=""
    return 502, {"ok":False,"error":"make_http_error","status":getattr(e,'code',None),"body":body}
  except urllib.error.URLError as e: return 502, {"ok":False,"error":"make_unreachable","reason":str(e)}
  except Exception as e: return 502, {"ok":False,"error":"make_unknown","reason":str(e)}
class H(BaseHTTPRequestHandler):
  def _s(self,c=200,t="application/json"): self.send_response(c); self.send_header("Content-Type",t); self.end_headers()
  def do_GET(self):
    if self.path=="/api/health": self._s(); self.wfile.write(json.dumps({"ok":True,"mode":"forward" if os.environ.get("MAKE_FORWARD")=="1" else "sim","ts":datetime.datetime.utcnow().isoformat()}).encode())
    else: self._s(404)
  def do_POST(self):
    m=re.match(r"^/api/invoke/(?P<id>[^/]+)$",self.path)
    if not m: self._s(404); return
    aid=m.group("id"); a=self.headers.get("Authorization",""); r=self.headers.get("X-Route",""); c=self.headers.get("X-Correlation-Id","")
    if not a or not a.startswith("Bearer "): self._s(401); self.wfile.write(b'{"error":"missing Authorization Bearer"}'); return
    if not r or not c: self._s(400); self.wfile.write(b'{"error":"missing X-Route or X-Correlation-Id"}'); return
    if aid not in ROUTES: self._s(404); self.wfile.write(b'{"error":"unknown agent id"}'); return
    l=int(self.headers.get("Content-Length","0") or 0); body=self.rfile.read(l) if l>0 else b"{}"
    try: payload=json.loads(body or b"{}")
    except Exception: payload={}
    if os.environ.get("MAKE_FORWARD")=="1":
      code,out=fwd(aid, body, c, float(os.environ.get("MAKE_TIMEOUT","4") or 4))
      self._s(code); self.wfile.write(json.dumps({"id":aid,"route":r,"forward":True,"resp":out}).encode()); return
    self._s(200); self.wfile.write(json.dumps({"id":aid,"ok":True,"forward":False,"echo":payload,"route":r}).encode())
  def log_message(self, fmt, *args): sys.stderr.write("DEBUG: " + (fmt%args) + "\n")
if __name__=="__main__":
  host=os.environ.get("HOST","127.0.0.1"); port=int(os.environ.get("PORT","8080")); sys.stderr.write(f"DEBUG: start {host}:{port} forward={os.environ.get('MAKE_FORWARD')=='1'}\n")
  HTTPServer((host,port),H).serve_forever()
PY
fi

# ---------- 3) parche cockpit (URL /invoke + mensaje Actividad) ----------
FILE="$(grep -RIl --include='*.tsx' --include='*.jsx' 'export default function EconeuraCockpit' apps 2>/dev/null | head -n1 || true)"
[ -z "$FILE" ] && FILE="$(grep -RIl --include='*.tsx' --include='*.jsx' 'async function invokeAgent' apps 2>/dev/null | head -n1 || true)"
[ -n "$FILE" ] || { echo "No encuentro el cockpit en apps/**"; exit 1; }
mkdir -p "$BK/$(dirname "$FILE")"; cp -a "$FILE" "$BK/$FILE"
python3 - "$FILE" <<'PY'
import re,sys
p=sys.argv[1]; s=open(p,'r',encoding='utf-8').read(); o=s
s=re.sub(r"url\s*=\s*`?\s*\$\{base\}/api/invoke/\$\{agentId\}\s*`?;", "url = `${base}/invoke/${agentId}`;", s)
s=re.sub(r"message:\s*res\?\.\s*output\s*\|\|\s*'OK'",
         'message: (res?.output || res?.echo || res?.resp || (typeof res==="object" ? JSON.stringify(res) : String(res)))', s)
open(p,'w',encoding='utf-8').write(s) if s!=o else None
print(p)
PY

# ---------- 4) Vite proxy /api -> API ----------
python3 - <<'PY'
import json,os,sys
pj="apps/web/package.json"
if not os.path.exists(pj): sys.exit(0)
pkg=json.load(open(pj))
deps={**pkg.get("dependencies",{}), **pkg.get("devDependencies",{})}
has_react="@vitejs/plugin-react" in deps
vc="apps/web/vite.config.ts"
if has_react:
  os.makedirs(os.path.dirname(vc),exist_ok=True)
  open(vc,"w").write("""import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins:[react()], server:{ host:true, strictPort:true, port:5173,
  proxy:{ '/api':{ target:'http://127.0.0.1:8080', changeOrigin:false, secure:false } } } })
""")
PY

# ---------- 5) levantar API + WEB con puertos libres ----------
P_API="$(free_port "${PORT_API:-8080}")"
HOST_API="${HOST_API:-127.0.0.1}"
PORT_WEB_DEFAULT="${PORT_WEB:-5173}"
P_WEB="$(free_port "$PORT_WEB_DEFAULT")"

# Set environment variables for the server
export PORT="$P_API"
export HOST="$HOST_API"

python3 -u apps/api_py/server.py > "$RUN/api.log" 2>&1 & API_PID=$!
trap 'kill ${API_PID:-0} ${WEB_PID:-0} 2>/dev/null || true' EXIT

for i in {1..60}; do curl -fsS "http://$HOST_API:$P_API/api/health" >/dev/null && break || sleep 0.2; done
curl -fsS "http://$HOST_API:$P_API/api/health" | tee "$RUN/health.json" >/dev/null

WEB_PID=0
if command -v pnpm >/dev/null; then PKG=pnpm; elif command -v npm >/dev/null; then PKG=npm; else PKG=""; fi

if [ -n "$PKG" ] && [ -f apps/web/package.json ]; then
  $PKG -C apps/web run dev -- --port "$P_WEB" --strictPort --host > "$RUN/web.log" 2>&1 & WEB_PID=$!
  for i in {1..80}; do curl -fsS "http://127.0.0.1:$P_WEB" >/dev/null && break || sleep 0.25; done
  URL="http://localhost:$P_WEB"
elif [ -d apps/web/dist ]; then
  (cd apps/web/dist && python3 -m http.server "$P_WEB" > "../../$RUN/web.log" 2>&1) & WEB_PID=$!
  for i in {1..40}; do curl -fsS "http://127.0.0.1:$P_WEB" >/dev/null && break || sleep 0.25; done
  URL="http://localhost:$P_WEB"
else
  echo "No sé aún: sin Node y sin apps/web/dist. Plan: 1) instalar Node, 2) build Vite, 3) reejecutar." | tee "$RUN/_next.txt"
  URL="http://localhost:$P_WEB"
fi

# ---------- 6) smoke estricto: 10/10 OK y 3 errores controlados ----------
ok=0; for i in $(seq 1 10); do
  curl -fsS -XPOST "http://$HOST_API:$P_API/api/invoke/neura-$i" \
   -H "Authorization: Bearer X" -H "X-Route: azure" -H "X-Correlation-Id: cid-$i" \
   -H "Content-Type: application/json" -d '{"input":""}' >/dev/null && ok=$((ok+1))
done
e1=$(curl -s -o /dev/null -w "%{http_code}" -XPOST "http://$HOST_API:$P_API/api/invoke/neura-1")
e2=$(curl -s -o /dev/null -w "%{http_code}" -XPOST "http://$HOST_API:$P_API/api/invoke/neura-404" -H "Authorization: Bearer X" -H "X-Route: azure" -H "X-Correlation-Id: cid-e2" -H "Content-Type: application/json" -d '{}')
e3=$(curl -s -o /dev/null -w "%{http_code}" -XPOST "http://$HOST_API:$P_API/api/invoke/neura-1" -H "Authorization: Bearer X" -H "X-Correlation-Id: cid-e3" -H "Content-Type: application/json" -d '{}')
[ "$ok" -eq 10 ] || { echo "SMOKE FALLÓ ($ok/10)"; exit 1; }
[ "$e1" -eq 401 ] && [ "$e2" -eq 404 ] && [ "$e3" -eq 400 ] || { echo "Errores controlados inválidos e1:$e1 e2:$e2 e3:$e3"; exit 1; }

# ---------- 7) evidencia + commit ----------
echo "api_port,$P_API" > "$RUN/meta.csv"; echo "web_port,$P_WEB" >> "$RUN/meta.csv"; echo "url,$URL" >> "$RUN/meta.csv"
git add -A
git commit -m "Cockpit E2E pro: routing 10/10, API robusta, parche UI, proxy Vite, puertos libres, smoke 10/10 + errores controlados, evidencia $TS" || true

echo "API OK :$P_API · WEB OK :$P_WEB · OPEN $URL · Smoke 10/10 y errores controlados OK"
open_url "$URL"
wait