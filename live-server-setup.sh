#!/usr/bin/env bash
set -Eeuo pipefail; IFS=$'\n\t'
need(){ command -v "$1" >/dev/null || { echo "Falta $1"; exit 1; }; }
need python3; need sed; need grep

# 0) Rutas base
UI_DIST="apps/web/dist/index.html"
API="apps/api_server.py"

# 1) Asegura dist y fija GW + token para Live Server (no cambia layout)
mkdir -p "$(dirname "$UI_DIST")"
[ -f "$UI_DIST" ] || { [ -f apps/web/index.html ] && cp apps/web/index.html "$UI_DIST" || echo '<!doctype html><html><head><meta charset="utf-8"><title>ECONEURA</title><script src="https://cdn.tailwindcss.com"></script></head><body><div id="root"></div></body></html>' > "$UI_DIST"; }
grep -q "__ECONEURA_GW_URL" "$UI_DIST" || sed -i 's#</body>#<script>window.__ECONEURA_GW_URL="http://127.0.0.1:8080/api";window.__ECONEURA_BEARER="SIMULATED_TOKEN";window.dispatchEvent(new CustomEvent("auth:login"));</script></body>#' "$UI_DIST"

# 2) API con CORS + OPTIONS (si no lo tiene, lo parchea)
PATCH_TAG="#__ECONEURA_CORS_OK__"
grep -q "$PATCH_TAG" "$API" 2>/dev/null || cat > "$API" <<'PY'
import os,sys,re,json,mimetypes,datetime,urllib.request,urllib.error,urllib.parse
from http.server import BaseHTTPRequestHandler,HTTPServer
ROOT=os.path.abspath("apps/web/dist"); INDEX=os.path.join(ROOT,'index.html')
def load_routes():
  for p in ["agent-routing.json","packages/config/agent-routing.json"]:
    try:
      with open(p,"r",encoding="utf-8") as f: return {r["id"]:r for r in json.load(f)}
    except: pass
  return {}
ROUTES=load_routes()
def read(p):
  try:
    with open(p,'rb') as f: return f.read()
  except:
    return None
class H(BaseHTTPRequestHandler):
  def _cors(self):
    self.send_header("Access-Control-Allow-Origin","*")
    self.send_header("Access-Control-Allow-Headers","authorization, x-route, x-correlation-id, content-type")
    self.send_header("Access-Control-Allow-Methods","GET,POST,OPTIONS")
  def _h(self,code=200,ctype="application/json",extra=None):
    self.send_response(code); self._cors(); self.send_header("Content-Type",ctype)
    self.send_header("X-Frame-Options","DENY"); self.send_header("X-Content-Type-Options","nosniff"); self.send_header("Referrer-Policy","no-referrer")
    if extra: [self.send_header(k,v) for k,v in extra.items()]
    self.end_headers()
  def do_OPTIONS(self): self._h(204)
  def do_GET(self):
    if self.path=="/api/health":
      self._h(200); self.wfile.write(json.dumps({"ok":True,"ts":datetime.datetime.utcnow().isoformat()}).encode()); return
    p=self.path.split('?',1)[0]; p="/index.html" if p=="/" else p
    fp=os.path.abspath(os.path.join(ROOT,p.lstrip('/')))
    if fp.startswith(ROOT) and os.path.isfile(fp):
      self._h(200,mimetypes.guess_type(fp)[0] or "application/octet-stream"); self.wfile.write(read(fp)); return
    self._h(200,"text/html"); self.wfile.write(read(INDEX) or b"dist missing")
  def do_POST(self):
    m=re.match(r"^/api/invoke/(?P<id>[^/]+)$", self.path)
    if not m: self._h(404); self.wfile.write(b'{"error":"not found"}'); return
    aid=m.group("id"); auth=self.headers.get("Authorization",""); route=(self.headers.get("X-Route","") or "").lower()
    cid=self.headers.get("X-Correlation-Id","")
    if not auth.startswith("Bearer "): self._h(401); self.wfile.write(b'{"error":"missing Authorization Bearer"}'); return
    if not route or not cid: self._h(400); self.wfile.write(b'{"error":"missing X-Route or X-Correlation-Id"}'); return
    ln=int(self.headers.get("Content-Length","0") or 0); body=self.rfile.read(ln) if ln>0 else b"{}"
    r=ROUTES.get(aid)
    if r and route!="local":
      url=r.get("url",""); mode=(r.get("auth","header") or "header").lower(); keyenv=r.get("keyEnv","")
      tok=os.environ.get(keyenv,"")
      try:
        hdr={"Content-Type":"application/json"}
        if mode=="header" and tok: hdr["x-make-token"]=tok
        if mode=="query" and tok:
          sep="&" if urllib.parse.urlparse(url).query else "?"
          url=f"{url}{sep}token={urllib.parse.quote(tok)}"
        req=urllib.request.Request(url, data=body, headers=hdr, method="POST")
        with urllib.request.urlopen(req, timeout=8) as resp:
          data=resp.read(); self._h(resp.getcode(), resp.headers.get_content_type() or "application/json"); self.wfile.write(data or b"{}"); return
      except urllib.error.URLError:
        self._h(502); self.wfile.write(b'{"error":"make timeout","id":"'+aid.encode()+b'"}'); return
      except Exception as e:
        self._h(502); self.wfile.write(('{"error":"proxy failed","detail":'+json.dumps(str(e))+'}').encode()); return
    self._h(200); self.wfile.write(json.dumps({"id":aid,"ok":True,"simulated":True,"echo":json.loads(body or b"{}")}).encode())
  def log_message(self, fmt, *args): sys.stderr.write("DEBUG: "+(fmt%args)+"\n")
if __name__=="__main__":
  print("DEBUG: API on http://127.0.0.1:8080")  # __ECONEURA_CORS_OK__
  HTTPServer(("127.0.0.1",8080),H).serve_forever()
PY

# 3) Arranca API y smoke
pkill -f "apps/api_server.py" 2>/dev/null || true
python3 -u "$API" >/dev/null 2>&1 & PID=$!
trap 'kill ${PID:-0} 2>/dev/null || true' EXIT
for i in {1..60}; do curl -fsS http://127.0.0.1:8080/api/health >/dev/null && break || sleep 0.2; done
curl -fsS -X POST http://127.0.0.1:8080/api/invoke/neura-1 \
  -H "Authorization: Bearer X" -H "X-Route: local" -H "X-Correlation-Id: cid-1" -H "Content-Type: application/json" \
  -d '{"input":"ok"}' | grep -q '"ok": true' && echo "OK: Backend listo con CORS."

echo "Ahora abre Live Server sobre $UI_DIST y navega a http://127.0.0.1:5500/apps/web/dist/"
echo "El cockpit usará http://127.0.0.1:8080/api con token simulado."