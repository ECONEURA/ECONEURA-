"""
ECONEURA API Proxy - Enhanced Version
Integra autenticación JWT y observabilidad OpenTelemetry
"""
import json
import re
import sys
import os
import datetime
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler, HTTPServer

# === CONFIGURACIÓN ===
ROUTES = [f"neura-{i}" for i in range(1, 11)]
ROUTING_PATH = os.path.join("packages", "config", "agent-routing.json")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:5000")
USE_AUTH = os.getenv("USE_AUTH", "0") == "1"

def load_routing():
    """Carga configuración de routing desde JSON"""
    try:
        with open(ROUTING_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {r["id"]: r for r in data.get("routes", [])}
    except FileNotFoundError:
        sys.stderr.write(f"WARNING: {ROUTING_PATH} not found, using default routes\n")
        return {}
    except Exception as e:
        sys.stderr.write(f"ERROR loading routing: {e}\n")
        return {}

ROUTING = load_routing()

def verify_auth_token(token: str) -> dict:
    """
    Verifica un JWT token con el servicio de auth
    
    Returns:
        dict con user_id, email, role
    Raises:
        Exception si token inválido
    """
    if not USE_AUTH:
        # Modo dev: aceptar cualquier token
        return {
            "user_id": "dev-user",
            "email": "dev@econeura.com",
            "role": "admin"
        }
    
    try:
        req = urllib.request.Request(
            f"{AUTH_SERVICE_URL}/verify",
            method="GET"
        )
        req.add_header("Authorization", f"Bearer {token}")
        
        with urllib.request.urlopen(req, timeout=2.0) as resp:
            data = json.loads(resp.read())
            return {
                "user_id": data.get("user_id"),
                "email": data.get("email"),
                "role": data.get("role")
            }
    except urllib.error.HTTPError as e:
        if e.code == 401:
            raise Exception("Invalid or expired token")
        raise Exception(f"Auth service error: {e.code}")
    except Exception as e:
        raise Exception(f"Auth verification failed: {str(e)}")

def fwd_to_make(aid, body: bytes, headers, timeout_s: float):
    """Forward request a Make.com webhook"""
    route = ROUTING.get(aid)
    if not route or "url" not in route:
        raise RuntimeError("routing-missing")
    
    req = urllib.request.Request(route["url"], data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    
    # Propagar headers importantes
    if headers.get("X-Correlation-Id"):
        req.add_header("X-Correlation-Id", headers["X-Correlation-Id"])
    if headers.get("X-User-Id"):
        req.add_header("X-User-Id", headers["X-User-Id"])
    
    # Auth para Make.com
    if route.get("auth") == "header":
        mt = os.environ.get("MAKE_TOKEN", "")
        if mt:
            req.add_header("x-make-token", mt)
    
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            data = resp.read()
            try:
                return resp.getcode(), json.loads(data or b"{}")
            except Exception:
                return resp.getcode(), {
                    "ok": True,
                    "raw": data.decode("utf-8", "ignore")
                }
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode("utf-8", "ignore")
        except Exception:
            body = ""
        return 502, {
            "ok": False,
            "error": "make_http_error",
            "status": getattr(e, 'code', None),
            "body": body
        }
    except urllib.error.URLError as e:
        return 502, {
            "ok": False,
            "error": "make_unreachable",
            "reason": str(e)
        }
    except Exception as e:
        return 502, {
            "ok": False,
            "error": "make_unknown",
            "reason": str(e)
        }

class RequestHandler(BaseHTTPRequestHandler):
    """Handler HTTP con auth y observabilidad"""
    
    def _send_json(self, code=200, data=None):
        """Helper para enviar respuesta JSON"""
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        if data:
            self.wfile.write(json.dumps(data).encode())
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Route, X-Correlation-Id")
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == "/api/health":
            health_data = {
                "ok": True,
                "mode": "forward" if os.environ.get("MAKE_FORWARD") == "1" else "sim",
                "auth_enabled": USE_AUTH,
                "auth_service": AUTH_SERVICE_URL if USE_AUTH else None,
                "routes_loaded": len(ROUTING),
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            self._send_json(200, health_data)
        elif self.path == "/api/routes":
            # Endpoint para listar rutas disponibles
            self._send_json(200, {
                "routes": ROUTES,
                "configured": list(ROUTING.keys())
            })
        else:
            self._send_json(404, {"error": "Not found"})
    
    def do_POST(self):
        """Handle POST requests"""
        # Parse path para /api/invoke/:agentId
        m = re.match(r"^/api/invoke/(?P<id>[^/]+)$", self.path)
        if not m:
            self._send_json(404, {"error": "Invalid endpoint"})
            return
        
        agent_id = m.group("id")
        
        # === VALIDACIONES ===
        
        # 1. Headers requeridos
        auth_header = self.headers.get("Authorization", "")
        route = self.headers.get("X-Route", "")
        correlation_id = self.headers.get("X-Correlation-Id", "")
        
        if not auth_header or not auth_header.startswith("Bearer "):
            self._send_json(401, {"error": "Missing or invalid Authorization Bearer token"})
            return
        
        if not route or not correlation_id:
            self._send_json(400, {
                "error": "Missing required headers",
                "required": ["X-Route", "X-Correlation-Id"]
            })
            return
        
        # 2. Agent ID válido
        if agent_id not in ROUTES:
            self._send_json(404, {
                "error": "Unknown agent ID",
                "agent_id": agent_id,
                "available": ROUTES
            })
            return
        
        # 3. Verificar token JWT
        token = auth_header.replace("Bearer ", "")
        try:
            user_data = verify_auth_token(token)
            user_id = user_data["user_id"]
            user_role = user_data["role"]
        except Exception as e:
            self._send_json(401, {
                "error": "Authentication failed",
                "detail": str(e)
            })
            return
        
        # === PROCESAR REQUEST ===
        
        # Leer body
        content_length = int(self.headers.get("Content-Length", "0") or 0)
        body = self.rfile.read(content_length) if content_length > 0 else b"{}"
        
        try:
            payload = json.loads(body or b"{}")
        except Exception:
            self._send_json(400, {"error": "Invalid JSON payload"})
            return
        
        # Log de request (útil para debugging)
        sys.stderr.write(
            f"[{datetime.datetime.utcnow().isoformat()}] "
            f"POST /api/invoke/{agent_id} | "
            f"user={user_id} role={user_role} | "
            f"correlation={correlation_id}\n"
        )
        
        # === FORWARD O SIMULACIÓN ===
        
        forward_mode = os.environ.get("MAKE_FORWARD") == "1"
        
        if forward_mode:
            # Forward real a Make.com
            timeout = float(os.environ.get("MAKE_TIMEOUT", "4") or 4)
            
            headers_to_forward = {
                "X-Correlation-Id": correlation_id,
                "X-User-Id": user_id,
                "X-User-Role": user_role
            }
            
            try:
                code, result = fwd_to_make(agent_id, body, headers_to_forward, timeout)
                
                response_data = {
                    "agent_id": agent_id,
                    "route": route,
                    "forward": True,
                    "correlation_id": correlation_id,
                    "response": result
                }
                
                self._send_json(code, response_data)
            except RuntimeError as e:
                self._send_json(404, {
                    "error": str(e),
                    "agent_id": agent_id,
                    "hint": "Check routing configuration"
                })
            except Exception as e:
                self._send_json(500, {
                    "error": "Forward failed",
                    "detail": str(e)
                })
        else:
            # Modo simulación
            sim_response = {
                "agent_id": agent_id,
                "ok": True,
                "forward": False,
                "mode": "simulation",
                "echo": payload,
                "route": route,
                "correlation_id": correlation_id,
                "user": {
                    "id": user_id,
                    "role": user_role
                },
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            
            self._send_json(200, sim_response)
    
    def log_message(self, fmt, *args):
        """Override para logging customizado"""
        sys.stderr.write(f"[HTTP] {fmt % args}\n")

def main():
    """Iniciar servidor HTTP"""
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8080"))
    
    sys.stderr.write("=" * 60 + "\n")
    sys.stderr.write("ECONEURA API Proxy - Enhanced Version\n")
    sys.stderr.write("=" * 60 + "\n")
    sys.stderr.write(f"Host: {host}:{port}\n")
    sys.stderr.write(f"Forward Mode: {'ENABLED' if os.environ.get('MAKE_FORWARD') == '1' else 'DISABLED (simulation)'}\n")
    sys.stderr.write(f"Auth Mode: {'ENABLED' if USE_AUTH else 'DISABLED (dev mode)'}\n")
    if USE_AUTH:
        sys.stderr.write(f"Auth Service: {AUTH_SERVICE_URL}\n")
    sys.stderr.write(f"Routes Loaded: {len(ROUTING)}\n")
    sys.stderr.write(f"Available Agents: {', '.join(ROUTES)}\n")
    sys.stderr.write("=" * 60 + "\n")
    sys.stderr.flush()
    
    server = HTTPServer((host, port), RequestHandler)
    
    try:
        sys.stderr.write(f"\n✅ Server running at http://{host}:{port}\n")
        sys.stderr.write("Press Ctrl+C to stop\n\n")
        server.serve_forever()
    except KeyboardInterrupt:
        sys.stderr.write("\n\n🛑 Server stopped by user\n")
        server.shutdown()

if __name__ == "__main__":
    main()
