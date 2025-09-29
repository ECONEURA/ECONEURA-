import subprocess, time, json, os

def test_server():
    # Configurar puerto de prueba
    test_port = "8081"
    os.environ["PORT"] = test_port

    # Iniciar servidor
    print("🚀 Iniciando servidor de prueba...")
    server = subprocess.Popen(["python3", "apps/api_server.py"],
                            cwd="/workspaces/ECONEURA-",
                            env=dict(os.environ))

    # Esperar que inicie
    time.sleep(3)

    base_url = f"http://127.0.0.1:{test_port}"

    try:
        # Test 1: Health endpoint
        print("🏥 Probando health endpoint...")
        result = subprocess.run(["curl", "-s", f"{base_url}/api/health"],
                              capture_output=True, text=True)
        if result.returncode == 0:
            try:
                data = json.loads(result.stdout)
                if data.get("ok") and "server" in data and "version" in data:
                    print(f"✅ Health OK: {data['server']} v{data['version']}")
                else:
                    print(f"❌ Health response incomplete: {data}")
            except json.JSONDecodeError:
                print(f"❌ Health invalid JSON: {result.stdout}")
        else:
            print(f"❌ Health curl failed: {result.returncode}")

        # Test 2: CORS preflight
        print("🌐 Probando CORS preflight...")
        result = subprocess.run([
            "curl", "-s", "-X", "OPTIONS", f"{base_url}/api/invoke/test",
            "-H", "Origin: http://localhost:3000",
            "-H", "Access-Control-Request-Method: POST"
        ], capture_output=True, text=True)
        if result.returncode == 0 and "Access-Control-Allow-Origin" in (result.stdout or ""):
            print("✅ CORS headers OK")
        else:
            print("❌ CORS headers missing")

        # Test 3: Valid invoke
        print("🤖 Probando invoke válido...")
        result = subprocess.run([
            "curl", "-s", "-X", "POST", f"{base_url}/api/invoke/neura-1",
            "-H", "Authorization: Bearer test-token",
            "-H", "X-Route: test-route",
            "-H", "X-Correlation-Id: test-123",
            "-H", "Content-Type: application/json",
            "-d", '{"input":"test message","params":{"key":"value"}}'
        ], capture_output=True, text=True)
        if result.returncode == 0:
            try:
                data = json.loads(result.stdout)
                if data.get("ok") and data.get("id") == "neura-1" and "correlationId" in data:
                    print(f"✅ Invoke OK: agent={data['id']}, correlation={data['correlationId']}")
                else:
                    print(f"❌ Invoke response incomplete: {data}")
            except json.JSONDecodeError:
                print(f"❌ Invoke invalid JSON: {result.stdout}")
        else:
            print(f"❌ Invoke curl failed: {result.returncode}")

        # Test 4: Error cases
        print("⚠️  Probando casos de error...")

        # Missing auth
        result = subprocess.run([
            "curl", "-s", "-X", "POST", f"{base_url}/api/invoke/neura-1",
            "-H", "X-Route: test", "-H", "X-Correlation-Id: test-123"
        ], capture_output=True, text=True)
        if "INVALID_AUTH" in (result.stdout or ""):
            print("✅ Auth validation OK")
        else:
            print("❌ Auth validation failed")

        # Missing route
        result = subprocess.run([
            "curl", "-s", "-X", "POST", f"{base_url}/api/invoke/neura-1",
            "-H", "Authorization: Bearer test-token",
            "-H", "X-Correlation-Id: test-123"
        ], capture_output=True, text=True)
        if "MISSING_ROUTE" in (result.stdout or ""):
            print("✅ Route validation OK")
        else:
            print("❌ Route validation failed")

        # Invalid JSON
        result = subprocess.run([
            "curl", "-s", "-X", "POST", f"{base_url}/api/invoke/neura-1",
            "-H", "Authorization: Bearer test-token",
            "-H", "X-Route: test", "-H", "X-Correlation-Id: test-123",
            "-H", "Content-Type: application/json",
            "-d", '{"invalid": json}'
        ], capture_output=True, text=True)
        if "INVALID_JSON" in (result.stdout or ""):
            print("✅ JSON validation OK")
        else:
            print("❌ JSON validation failed")

        # Test 5: Static files
        print("📁 Probando archivos estáticos...")
        result = subprocess.run(["curl", "-s", f"{base_url}/"], capture_output=True, text=True)
        if result.returncode == 0 and "ECONEURA Cockpit" in (result.stdout or ""):
            print("✅ Static files OK")
        else:
            print("❌ Static files failed")

    finally:
        # Detener servidor
        print("🛑 Deteniendo servidor...")
        server.terminate()
        try:
            server.wait(timeout=5)
            print("✅ Servidor detenido gracefully")
        except subprocess.TimeoutExpired:
            server.kill()
            print("⚠️  Servidor forzado a detener")

if __name__ == "__main__":
    test_server()
