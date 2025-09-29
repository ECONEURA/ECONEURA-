#!/usr/bin/env bash
set -Eeuo pipefail; IFS=$'\n\t'

need(){ command -v "$1" >/dev/null || { echo "Falta $1"; exit 1; }; }
need python3; need node; need npm

# 1) Localiza el cockpit original y corrige el doble /api
COCK="$(grep -RIl --include='*.tsx' --include='*.jsx' 'export default function EconeuraCockpit' . 2>/dev/null | head -n1 || true)"
[ -n "$COCK" ] || COCK="$(grep -RIl --include='*.tsx' --include='*.jsx' 'NEURA-CEO' . 2>/dev/null | head -n1 || true)"
[ -n "$COCK" ] || { echo "No encuentro EconeuraCockpit en el repo"; exit 1; }
python3 - "$COCK" <<'PY'
import sys,re; p=sys.argv[1]; s=open(p,encoding='utf-8').read(); o=s
s=re.sub(r"\$\{base\}/api/invoke/\$\{agentId\}", "${base}/invoke/${agentId}", s)
if s!=o: open(p,'w',encoding='utf-8').write(s); print("PATCH: invoke URL fix")
else: print("PATCH: already OK")
PY

# 2) Estructura web y copia 1:1 del cockpit al bundle
mkdir -p apps/web/src
cp -f "$COCK" apps/web/src/EconeuraCockpit.repo.tsx

# 3) index.html exacto con Tailwind CDN para mismo look&feel
cat > apps/web/index.html <<'HTML'
<!doctype html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ECONEURA Cockpit</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="min-h-screen bg-[#f2f7fb]"><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>
HTML

# 4) main.tsx y App.tsx que usan el mismo componente
cat > apps/web/src/main.tsx <<'TS'
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
createRoot(document.getElementById('root')!).render(<App/>)
TS
cat > apps/web/src/App.tsx <<'TS'
import React from 'react'
import EconeuraCockpit from './EconeuraCockpit.repo'
export default function App(){ return <EconeuraCockpit/> }
TS

# 5) package.json mínimo con versiones estables
if [ ! -f apps/web/package.json ]; then
  mkdir -p apps/web
  pushd apps/web >/dev/null
  npm init -y >/dev/null
  npm pkg set type="module" >/dev/null
  npm pkg set scripts.build="vite build" scripts.dev="vite" >/dev/null
  npm pkg set dependencies.react="18.2.0" dependencies["react-dom"]="18.2.0" dependencies["lucide-react"]="0.462.0" >/dev/null
  npm pkg set devDependencies.vite="5.4.9" devDependencies["@vitejs/plugin-react"]="4.3.1" devDependencies.typescript="5.6.2" >/dev/null
  popd >/dev/null
fi

# 6) tsconfig y vite.config
cat > apps/web/tsconfig.json <<'JSON'
{ "compilerOptions": { "target":"ES2020","lib":["ES2020","DOM"],"jsx":"react-jsx","module":"ESNext","moduleResolution":"Bundler","strict":true,"skipLibCheck":true,"types":[] }, "include":["src"] }
JSON
cat > apps/web/vite.config.ts <<'TS'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins:[react()], build:{ outDir:'dist', assetsDir:'assets', sourcemap:false }})
TS

# 7) Build del cockpit
npm --prefix apps/web i >/dev/null
npm --prefix apps/web run build >/dev/null

# 8) Server Python único en 8080: sirve SPA y API /api/*
cat > apps/api_server.py <<'PY'
import os,sys,re,json,mimetypes,datetime
from http.server import BaseHTTPRequestHandler,HTTPServer
ROOT=os.path.abspath("apps/web/dist"); INDEX=os.path.join(ROOT,'index.html')
def read(p):
  try: 
    with open(p,'rb') as f: return f.read()
  except: 
    return None
class H(BaseHTTPRequestHandler):
  def _h(self,code=200,ctype="application/json",extra=None):
    self.send_response(code); self.send_header("Content-Type",ctype)
    self.send_header("Cache-Control","public, max-age=300" if ctype!="text/html" else "no-cache")
    self.send_header("X-Frame-Options","DENY"); self.send_header("X-Content-Type-Options","nosniff")
    self.send_header("Referrer-Policy","no-referrer")
    if extra: 
      for k,v in extra.items(): self.send_header(k,v)
    self.end_headers()
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
    aid=m.group("id"); auth=self.headers.get("Authorization",""); route=self.headers.get("X-Route",""); cid=self.headers.get("X-Correlation-Id","")
    if not auth.startswith("Bearer "): self._h(401); self.wfile.write(b'{"error":"missing Authorization Bearer"}'); return
    if not route or not cid: self._h(400); self.wfile.write(b'{"error":"missing X-Route or X-Correlation-Id"}'); return
    ln=int(self.headers.get("Content-Length","0") or 0); body=self.rfile.read(ln) if ln>0 else b"{}"
    self._h(200); self.wfile.write(json.dumps({"id":aid,"ok":True,"echo":json.loads(body or b"{}")}).encode())
  def log_message(self, fmt, *args): sys.stderr.write("DEBUG: "+(fmt%args)+"\n")
if __name__=="__main__":
  HTTPServer(("127.0.0.1",8080),H).serve_forever()
PY

# 9) Arranca y verifica
python3 -u apps/api_server.py >/dev/null 2>&1 & PID=$!
trap 'kill ${PID:-0} 2>/dev/null || true' EXIT
for i in {1..80}; do curl -fsS http://127.0.0.1:8080/ >/dev/null && break || sleep 0.2; done
curl -fsS http://127.0.0.1:8080/api/health | grep -q '"ok": true' && echo "Cockpit listo: http://127.0.0.1:8080/" || { echo "Fallo health"; exit 1; }