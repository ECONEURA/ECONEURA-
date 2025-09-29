import subprocess, time, json

# Iniciar servidor
print("Iniciando servidor...")
server = subprocess.Popen(["python3", "apps/api_server.py"], cwd="/workspaces/ECONEURA-")
time.sleep(2)

# Probar health
print("Probando health...")
result = subprocess.run(["curl", "-s", "http://127.0.0.1:8080/api/health"], capture_output=True, text=True)
if result.returncode == 0:
    try:
        data = json.loads(result.stdout)
        print(f"✓ Health OK: {data}")
    except:
        print(f"✗ Health failed: {result.stdout}")
else:
    print(f"✗ Health curl failed: {result.returncode}")

# Probar invoke
print("Probando invoke...")
result = subprocess.run([
    "curl", "-s", "-X", "POST", "http://127.0.0.1:8080/api/invoke/neura-1",
    "-H", "Authorization: Bearer test-token",
    "-H", "X-Route: test", 
    "-H", "X-Correlation-Id: test-123",
    "-H", "Content-Type: application/json",
    "-d", '{"input":"test"}'
], capture_output=True, text=True)
if result.returncode == 0:
    try:
        data = json.loads(result.stdout)
        print(f"✓ Invoke OK: {data}")
    except:
        print(f"✗ Invoke failed: {result.stdout}")
else:
    print(f"✗ Invoke curl failed: {result.returncode}")

# Detener servidor
print("Deteniendo servidor...")
server.terminate()
server.wait()
print("✓ Test completado")
