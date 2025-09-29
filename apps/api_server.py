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
