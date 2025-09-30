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
