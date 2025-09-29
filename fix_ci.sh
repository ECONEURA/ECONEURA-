#!/usr/bin/env bash
set -Eeuo pipefail; IFS=$'\n\t'
need(){ command -v "$1" >/dev/null || { echo "Falta $1"; exit 1; }; }; need python3; need git
mkdir -p apps/api_py packages/config apps/web .github/workflows

# 1) .env.example (cliente y servidor, sin secretos)
cat > apps/web/.env.example <<'ENV'
VITE_NEURA_GW_URL=/api
# Copia sin secretos. El token va en window.__ECONEURA_BEARER desde la UI.
ENV
cat > apps/api_py/.env.example <<'ENV'
# Activa reenvío real a Make. Si "0" o vacío -> simulación segura.
MAKE_FORWARD=0
# Timeout de Make en segundos
MAKE_TIMEOUT=4
# Cabecera x-make-token si agent-routing.json.auth="header"
MAKE_TOKEN=__REEMPLAZA_EN_LOCAL__
ENV

# 2) Server Python con FORWARD opcional a Make (urllib, timeout->502)
cat > apps/api_py/server.py <<'PY'
import json,re,sys,os,datetime,urllib.request,urllib.error
from http.server import BaseHTTPRequestHandler,HTTPServer

ROUTES=[f"neura-{i}" for i in range(1,11)]
ROUTING_PATH=os.path.join("packages","config","agent-routing.json")
def load_routing():
  try:
    with open(ROUTING_PATH,"r",encoding="utf-8") as f: return {r["id"]:r for r in json.load(f)}
  except Exception: return {}
ROUTING=load_routing()

def fwd_to_make(aid, body:bytes, headers, timeout_s:float):
  route=ROUTING.get(aid); 
  if not route or "url" not in route: raise RuntimeError("routing-missing")
  req=urllib.request.Request(route["url"], data=body, method="POST")
  req.add_header("Content-Type","application/json")
  # Propaga correlación mínima
  if headers.get("X-Correlation-Id"): req.add_header("X-Correlation-Id", headers["X-Correlation-Id"])
  # Auth header si procede
  if route.get("auth")=="header":
    mt=os.environ.get("MAKE_TOKEN","")
    if mt: req.add_header("x-make-token", mt)
  try:
    with urllib.request.urlopen(req, timeout=timeout_s) as resp:
      data=resp.read()
      try: return resp.getcode(), json.loads(data or b"{}")
      except Exception: return resp.getcode(), {"ok":True,"raw":data.decode("utf-8","ignore")}
  except urllib.error.HTTPError as e:
    try: body=e.read().decode("utf-8","ignore")
    except Exception: body=""
    return 502, {"ok":False,"error":"make_http_error","status":getattr(e,'code',None),"body":body}
  except urllib.error.URLError as e:
    return 502, {"ok":False,"error":"make_unreachable","reason":str(e)}
  except Exception as e:
    return 502, {"ok":False,"error":"make_unknown","reason":str(e)}

class H(BaseHTTPRequestHandler):
  def _s(self,c=200,t="application/json"): self.send_response(c); self.send_header("Content-Type",t); self.end_headers()
  def do_GET(self):
    if self.path=="/api/health":
      self._s(); self.wfile.write(json.dumps({"ok":True,"mode":"forward" if os.environ.get("MAKE_FORWARD")=="1" else "sim","ts":datetime.datetime.utcnow().isoformat()}).encode())
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
    forward = os.environ.get("MAKE_FORWARD")=="1"
    if forward:
      code, out = fwd_to_make(aid, body, {"X-Correlation-Id":c}, float(os.environ.get("MAKE_TIMEOUT","4") or 4))
      self._s(code); self.wfile.write(json.dumps({"id":aid,"route":r,"forward":True,"resp":out}).encode()); return
    # simulación segura
    self._s(200); self.wfile.write(json.dumps({"id":aid,"ok":True,"forward":False,"echo":payload,"route":r}).encode())
  def log_message(self, fmt, *args): sys.stderr.write("DEBUG: " + (fmt%args) + "\n")

if __name__=="__main__":
  host=os.environ.get("HOST","127.0.0.1"); port=int(os.environ.get("PORT","8080"))
  sys.stderr.write(f"DEBUG: starting at {host}:{port} | forward={os.environ.get('MAKE_FORWARD')=='1'}\n"); sys.stderr.flush()
  HTTPServer((host,port),H).serve_forever()
PY

# 3) Verificación local rápida (modo sim por defecto)
HOST=127.0.0.1
PORT=8080
python3 -u apps/api_py/server.py "$PORT" > .local_server.log 2>&1 & pid=$!
trap 'kill $pid 2>/dev/null || true' EXIT
for i in {1..30}; do curl -fsS "http://$HOST:$PORT/api/health" >/dev/null && break || sleep 0.2; done
curl -fsS -XPOST "http://$HOST:$PORT/api/invoke/neura-1" \
 -H "Authorization: Bearer X" -H "X-Route: azure" -H "X-Correlation-Id: cid-1" \
 -H "Content-Type: application/json" -d '{"input":""}' >/dev/null
kill $pid || true; trap - EXIT

# 4) Commit y push opcional
git add -A
git commit -m "API: forward opcional a Make (MAKE_FORWARD=1), timeout->502; env examples; contrato estable" || true
[ -n "${REPO_URL:-}" ] && { git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"; git push -u origin "$(git rev-parse --abbrev-ref HEAD)"; } || echo 'Define REPO_URL para push automático.'
echo "OK: proxy listo. Activar forward real con: MAKE_FORWARD=1 MAKE_TOKEN=xxx python3 apps/api_py/server.py 8080"