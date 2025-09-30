# COCKPIT 1:1 EN VS CODE ( pestaña Simple Browser )  — SIN BUILD, SIN VITE
set -Eeuo pipefail; IFS=$'\n\t'
ROOT="apps/web/dist"; API="apps/api_server.py"; mkdir -p "$ROOT"

# 1) Localiza tu componente TSX exacto
COCKPIT_SRC="apps/web/src/EconeuraCockpit.tsx"
[ -f "$COCKPIT_SRC" ] || { echo "ERROR: No encuentro $COCKPIT_SRC"; exit 1; }

# 2) Index con Tailwind, Import Map y Babel (transpila TSX en el navegador)
cat > "$ROOT/index.html" <<'HTML'
<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ECONEURA</title><script src="https://cdn.tailwindcss.com"></script>
<script>window.__ECONEURA_GW_URL="/api";window.__ECONEURA_BEARER="SIMULATED_TOKEN";window.dispatchEvent(new CustomEvent("auth:login"));</script>
<script type="importmap">{"imports":{
  "react":"https://esm.sh/react@18",
  "react-dom/client":"https://esm.sh/react-dom@18/client",
  "lucide-react":"https://esm.sh/lucide-react@0.426.0"
}}</script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head><body class="bg-[#f2f7fb] text-[#0f172a]"><div id="root"></div>
<script type="text/babel" data-type="module" data-presets="typescript,react">
HTML
# 3) Inserta TU TSX tal cual + montaje
cat "$COCKPIT_SRC" >> "$ROOT/index.html"
cat >> "$ROOT/index.html" <<'JS'

import { createRoot } from "react-dom/client";
const root = createRoot(document.getElementById("root"));
root.render(React.createElement(EconeuraCockpit));
</script></body></html>
JS

# 4) API unificada: estáticos + /api/health + /api/invoke/:id con CORS
cat > "$API" <<'PY'
import os, re, json, datetime, mimetypes
from http.server import BaseHTTPRequestHandler, HTTPServer
ROOT="apps/web/dist"; INDEX=os.path.join(ROOT,"index.html")
class H(BaseHTTPRequestHandler):
  def _h(self,code=200,ct="application/json"):
    self.send_response(code)
    self.send_header("Access-Control-Allow-Origin","*")
    self.send_header("Access-Control-Allow-Headers","authorization, x-route, x-correlation-id, content-type")
    self.send_header("Access-Control-Allow-Methods","GET,POST,OPTIONS")
    self.send_header("Content-Type",ct); self.end_headers()
  def do_OPTIONS(self): self._h(204)
  def do_GET(self):
    if self.path=="/api/health": self._h(); self.wfile.write(json.dumps({"ok":True,"ts":datetime.datetime.utcnow().isoformat()}).encode()); return
    p=self.path.split("?",1)[0]; p="/index.html" if p=="/" else p; fp=os.path.join(ROOT,p.lstrip("/"))
    if os.path.isfile(fp): self._h(200,mimetypes.guess_type(fp)[0] or "text/plain"); self.wfile.write(open(fp,"rb").read()); return
    self._h(200,"text/html"); self.wfile.write(open(INDEX,"rb").read())
  def do_POST(self):
    m=re.match(r"^/api/invoke/([^/]+)$", self.path)
    if not m: self._h(404); self.wfile.write(b'{"error":"not found"}'); return
    aid=m.group(1); a=self.headers.get("Authorization",""); r=self.headers.get("X-Route",""); c=self.headers.get("X-Correlation-Id","")
    if not a.startswith("Bearer "): self._h(401); self.wfile.write(b'{"error":"missing Authorization Bearer"}'); return
    if not r or not c: self._h(400); self.wfile.write(b'{"error":"missing X-Route or X-Correlation-Id"}'); return
    ln=int(self.headers.get("Content-Length","0") or 0); body=self.rfile.read(ln) if ln>0 else b"{}"
    self._h(200); self.wfile.write(json.dumps({"id":aid,"ok":True,"simulated":True,"echo":json.loads(body or b"{}")}).encode())
def run(): HTTPServer(("127.0.0.1",8080),H).serve_forever()
if __name__=="__main__": run()
PY

# 5) Arranca servidor y abre en VS Code (Simple Browser)
pkill -f "$API" 2>/dev/null || true
python3 -u "$API" >/tmp/econeura_api.log 2>&1 & for i in {1..60}; do curl -fsS http://127.0.0.1:8080/api/health && break || sleep 0.2; done
code --open-url 'vscode://ms-vscode.simple-browser/simple-browser.show?url=http%3A%2F%2F127.0.0.1%3A8080%2F' || echo 'Abre: F1 → Simple Browser → http://127.0.0.1:8080/'
echo "OK: Cockpit 1:1 en VS Code. API /api/health y /api/invoke/:id operativas."