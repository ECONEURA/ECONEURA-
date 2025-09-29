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
