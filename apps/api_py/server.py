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
