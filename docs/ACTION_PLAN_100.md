# PLAN DE ACCIÓN COMPLETO: ECONEURA 100% GA
**Fecha:** 8 octubre 2025  
**Estado Actual:** 43.25/100 → **Objetivo:** 95+/100  
**Duración Total:** 6 semanas (4 sprints de 1.5 semanas)

---

## ESTADO ACTUAL DEL PROYECTO

### Puntuación por Categoría (Weighted Score)
```
Backend Proxy        85/100  (peso 15%)  = 12.75 pts
Frontend             90/100  (peso 10%)  =  9.00 pts
Microservicios       40/100  (peso 15%)  =  6.00 pts
Base de Datos         0/100  (peso 15%)  =  0.00 pts ❌ CRÍTICO
Gobernanza IA         0/100  (peso 15%)  =  0.00 pts ❌ CRÍTICO
Autenticación         0/100  (peso 10%)  =  0.00 pts ❌ CRÍTICO
Observabilidad       30/100  (peso  8%)  =  2.40 pts
Tests                85/100  (peso  5%)  =  4.25 pts
Calidad de Código    85/100  (peso  5%)  =  4.25 pts
Documentación        60/100  (peso  4%)  =  2.40 pts
Dependencias         70/100  (peso  3%)  =  2.10 pts
CI/CD                40/100  (peso  5%)  =  2.00 pts
                                    ─────────────
                        TOTAL:      43.25/100
```

### Bloqueadores Críticos (3)
1. **Base de Datos (0/100):** Sin Postgres, sin schemas, sin RLS
2. **Gobernanza IA (0/100):** Sin HITL, sin DLP, sin FinOps
3. **Autenticación (0/100):** Sin JWT, sin RBAC, sin sesiones

---

## FASE 1: QUICK WINS (HOY - 1 HORA)
**Objetivo:** Eliminar errores menores y preparar terreno  
**Score Esperado:** 43.25 → 48.25 (+5 pts)

### Tareas Inmediatas

#### 1.1 Crear `packages/config/agent-routing.json` (15 min)
```bash
mkdir -p packages/config
cat > packages/config/agent-routing.json <<EOF
{
  "version": "1.0.0",
  "routes": {
    "neura-1": {"area": "analytics", "webhook": "https://hook.make.com/..."},
    "neura-2": {"area": "cdo", "webhook": "https://hook.make.com/..."},
    "neura-3": {"area": "cfo", "webhook": "https://hook.make.com/..."},
    "neura-4": {"area": "chro", "webhook": "https://hook.make.com/..."},
    "neura-5": {"area": "ciso", "webhook": "https://hook.make.com/..."},
    "neura-6": {"area": "cmo", "webhook": "https://hook.make.com/..."},
    "neura-7": {"area": "cto", "webhook": "https://hook.make.com/..."},
    "neura-8": {"area": "legal", "webhook": "https://hook.make.com/..."},
    "neura-9": {"area": "reception", "webhook": "https://hook.make.com/..."},
    "neura-10": {"area": "research", "webhook": "https://hook.make.com/..."}
  }
}
EOF
```

#### 1.2 Fijar versión `@types/react` (5 min)
```bash
pnpm add -D @types/react@18.3.12 -w
```

#### 1.3 Agregar script `test` a `package.json` (2 min)
```json
"scripts": {
  "test": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

#### 1.4 Fijar errores en `apps/cockpit/vitest.setup.ts` (10 min)
- Líneas 44-49: Corregir sintaxis de mock de `useNavigate`
- Verificar imports de `@testing-library/jest-dom`

#### 1.5 Validar Quick Wins (5 min)
```bash
pnpm -w lint
pnpm -w typecheck
pnpm -w test
```

**Checkpoint 1:** Commit después de Quick Wins
```bash
git add .
git commit -m "feat: quick wins - routing config, type fixes, test script"
git push origin main
```

---

## FASE 2: BASE DE DATOS POSTGRES (SEMANA 1, DÍA 1-3)
**Objetivo:** 0 → 80/100 en Database (+12 pts)  
**Score Esperado:** 48.25 → 60.25

### 2.1 Configuración Inicial (Día 1, 4 horas)

#### 2.1.1 Docker Compose para Postgres
```yaml
# docker-compose.dev.yml (actualizar)
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: econeura
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: econeura_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U econeura"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

#### 2.1.2 Schema Inicial (`db/init/01-schema.sql`)
```sql
-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tablas core
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'analyst', 'viewer')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agents (
  id VARCHAR(50) PRIMARY KEY,  -- neura-1, neura-2, ...
  area VARCHAR(100) NOT NULL,   -- analytics, cdo, cfo, ...
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE invocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id VARCHAR(50) REFERENCES agents(id),
  user_id UUID REFERENCES users(id),
  input JSONB NOT NULL,
  output JSONB,
  status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'success', 'error')),
  duration_ms INTEGER,
  correlation_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(100),
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_invocations_agent_id ON invocations(agent_id);
CREATE INDEX idx_invocations_user_id ON invocations(user_id);
CREATE INDEX idx_invocations_created_at ON invocations(created_at DESC);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
```

#### 2.1.3 Row-Level Security (`db/init/02-rls.sql`)
```sql
-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para users
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id OR auth.role() = 'admin');

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id OR auth.role() = 'admin');

-- Políticas RLS para invocations
CREATE POLICY invocations_select ON invocations
  FOR SELECT USING (
    user_id = auth.uid() OR 
    auth.role() IN ('admin', 'manager')
  );

CREATE POLICY invocations_insert_own ON invocations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Políticas RLS para audit_log
CREATE POLICY audit_log_select_admin ON audit_log
  FOR SELECT USING (auth.role() IN ('admin', 'manager'));

CREATE POLICY audit_log_insert_all ON audit_log
  FOR INSERT WITH CHECK (true);
```

### 2.2 Cliente Python para Postgres (Día 2, 3 horas)

#### 2.2.1 Actualizar `apps/api_py/requirements.txt`
```txt
psycopg2-binary==2.9.9
python-dotenv==1.0.1
```

#### 2.2.2 Crear `apps/api_py/db.py`
```python
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from typing import Optional, Dict, Any
from contextlib import contextmanager

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME", "econeura_dev"),
    "user": os.getenv("DB_USER", "econeura"),
    "password": os.getenv("DB_PASSWORD", "dev_password"),
}

@contextmanager
def get_db_connection():
    conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def log_invocation(agent_id: str, user_id: str, input_data: Dict, 
                   correlation_id: str) -> str:
    """Registra una invocación en la BD y retorna el ID"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO invocations (agent_id, user_id, input, status, correlation_id)
                VALUES (%s, %s, %s, 'pending', %s)
                RETURNING id
            """, (agent_id, user_id, input_data, correlation_id))
            result = cur.fetchone()
            return str(result['id'])

def update_invocation(invocation_id: str, output: Dict, 
                      status: str, duration_ms: int):
    """Actualiza el resultado de una invocación"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE invocations 
                SET output = %s, status = %s, duration_ms = %s, completed_at = NOW()
                WHERE id = %s
            """, (output, status, duration_ms, invocation_id))
```

#### 2.2.3 Integrar BD en `apps/api_py/server.py`
```python
# Agregar imports
from db import log_invocation, update_invocation
import time

# En do_POST, dentro de /api/invoke/:agentId
invocation_id = log_invocation(agent_id, user_id, payload, correlation_id)
start_time = time.time()

# ... hacer forward a Make.com ...

duration_ms = int((time.time() - start_time) * 1000)
update_invocation(invocation_id, response_data, 'success', duration_ms)
```

### 2.3 Seed Data (Día 3, 2 horas)

#### 2.3.1 Script de seed (`db/seeds/01-agents.sql`)
```sql
INSERT INTO agents (id, area, status, config) VALUES
('neura-1', 'analytics', 'active', '{"model": "gpt-4", "temperature": 0.7}'),
('neura-2', 'cdo', 'active', '{"model": "gpt-4", "temperature": 0.5}'),
('neura-3', 'cfo', 'active', '{"model": "gpt-4", "temperature": 0.3}'),
('neura-4', 'chro', 'active', '{"model": "gpt-4", "temperature": 0.6}'),
('neura-5', 'ciso', 'active', '{"model": "gpt-4", "temperature": 0.4}'),
('neura-6', 'cmo', 'active', '{"model": "gpt-4", "temperature": 0.8}'),
('neura-7', 'cto', 'active', '{"model": "gpt-4", "temperature": 0.5}'),
('neura-8', 'legal', 'active', '{"model": "gpt-4", "temperature": 0.2}'),
('neura-9', 'reception', 'active', '{"model": "gpt-4", "temperature": 0.7}'),
('neura-10', 'research', 'active', '{"model": "gpt-4", "temperature": 0.9}');

INSERT INTO users (email, name, role) VALUES
('admin@econeura.com', 'Admin User', 'admin'),
('manager@econeura.com', 'Manager User', 'manager'),
('analyst@econeura.com', 'Analyst User', 'analyst');
```

#### 2.3.2 Ejecutar seeds
```bash
docker compose -f docker-compose.dev.yml exec postgres psql -U econeura -d econeura_dev -f /seeds/01-agents.sql
```

### 2.4 Tests de Integración BD (Día 3, 2 horas)

#### 2.4.1 Crear `apps/api_py/test_db.py`
```python
import pytest
from db import log_invocation, update_invocation, get_db_connection

def test_log_invocation():
    invocation_id = log_invocation(
        agent_id="neura-1",
        user_id="test-user-123",
        input_data={"query": "test"},
        correlation_id="corr-123"
    )
    assert invocation_id is not None
    assert len(invocation_id) == 36  # UUID length

def test_update_invocation():
    # Primero crear
    inv_id = log_invocation("neura-2", "user-456", {"q": "hi"}, "c-456")
    
    # Luego actualizar
    update_invocation(inv_id, {"result": "ok"}, "success", 250)
    
    # Verificar
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM invocations WHERE id = %s", (inv_id,))
            result = cur.fetchone()
            assert result['status'] == 'success'
            assert result['duration_ms'] == 250
```

**Checkpoint 2:** Commit después de Base de Datos
```bash
git add db/ apps/api_py/
git commit -m "feat(db): Postgres + schemas + RLS + Python client"
git push origin main
```

---

## FASE 3: MICROSERVICIOS FASTAPI (SEMANA 1, DÍA 4-7)
**Objetivo:** 40 → 85/100 en Microservices (+6.75 pts)  
**Score Esperado:** 60.25 → 67.00

### 3.1 Template Base FastAPI (Día 4, 3 horas)

#### 3.1.1 Crear `services/neuras/_template/app.py`
```python
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Neura Service Template", version="1.0.0")

class InvokeRequest(BaseModel):
    input: dict
    context: Optional[dict] = None

class InvokeResponse(BaseModel):
    output: dict
    metadata: dict

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "template"}

@app.post("/invoke", response_model=InvokeResponse)
async def invoke(
    request: InvokeRequest,
    authorization: str = Header(...),
    x_correlation_id: str = Header(..., alias="X-Correlation-Id")
):
    """
    Endpoint principal de invocación del agente.
    Sobreescribir en cada microservicio específico.
    """
    logger.info(f"Invocation received: {x_correlation_id}")
    
    # TODO: Implementar lógica específica del área
    return InvokeResponse(
        output={"message": "Template response"},
        metadata={"correlation_id": x_correlation_id}
    )

@app.get("/metrics")
async def metrics():
    # TODO: Integrar Prometheus
    return {"invocations_total": 0}
```

#### 3.1.2 Crear `services/neuras/_template/requirements.txt`
```txt
fastapi==0.115.5
uvicorn[standard]==0.32.1
pydantic==2.10.3
psycopg2-binary==2.9.9
python-dotenv==1.0.1
httpx==0.28.1
```

#### 3.1.3 Crear `services/neuras/_template/Dockerfile`
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 3.2 Implementar 11 Microservicios (Día 5-6, 12 horas)

Para cada servicio en `services/neuras/{analytics,cdo,cfo,chro,ciso,cmo,cto,legal,reception,research,support}`:

1. Copiar template base
2. Personalizar `app.py` con lógica específica del área
3. Agregar `docker-compose.dev.yml` entry

#### Ejemplo: `services/neuras/analytics/app.py`
```python
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)
app = FastAPI(title="Neura Analytics", version="1.0.0")

class AnalyticsRequest(BaseModel):
    query: str
    data_source: str
    time_range: dict

@app.post("/invoke")
async def invoke(
    request: AnalyticsRequest,
    authorization: str = Header(...),
    x_correlation_id: str = Header(...)
):
    logger.info(f"Analytics invocation: {request.query}")
    
    # TODO: Integrar con herramientas de análisis (Pandas, SQL, etc.)
    result = {
        "analysis": f"Processed query: {request.query}",
        "insights": ["Insight 1", "Insight 2"],
        "visualization_url": "https://..."
    }
    
    return {
        "output": result,
        "metadata": {"correlation_id": x_correlation_id, "area": "analytics"}
    }
```

#### Actualizar `docker-compose.dev.yml`
```yaml
services:
  # ... postgres, etc ...
  
  neura-analytics:
    build: ./services/neuras/analytics
    ports:
      - "3101:8000"
    environment:
      - DB_HOST=postgres
    depends_on:
      postgres:
        condition: service_healthy
  
  neura-cdo:
    build: ./services/neuras/cdo
    ports:
      - "3102:8000"
    environment:
      - DB_HOST=postgres
    depends_on:
      postgres:
        condition: service_healthy
  
  # ... repetir para los 11 servicios (puertos 3101-3111) ...
```

### 3.3 Integrar Proxy → Microservicios (Día 7, 4 horas)

#### 3.3.1 Actualizar `apps/api_py/server.py`
```python
import httpx

SERVICE_PORTS = {
    "neura-1": 3101,  # analytics
    "neura-2": 3102,  # cdo
    "neura-3": 3103,  # cfo
    # ... hasta neura-10
}

def forward_to_microservice(agent_id: str, payload: dict, headers: dict) -> dict:
    """Enruta a microservicio FastAPI local"""
    port = SERVICE_PORTS.get(agent_id)
    if not port:
        raise ValueError(f"Unknown agent: {agent_id}")
    
    url = f"http://localhost:{port}/invoke"
    
    with httpx.Client(timeout=30.0) as client:
        response = client.post(url, json=payload, headers={
            "Authorization": headers.get("Authorization"),
            "X-Correlation-Id": headers.get("X-Correlation-Id")
        })
        response.raise_for_status()
        return response.json()

# En do_POST, reemplazar Make.com forward:
if os.getenv("USE_MICROSERVICES") == "1":
    result = forward_to_microservice(agent_id, payload, headers)
else:
    # Mantener Make.com como fallback
    result = forward_to_make(agent_id, payload, headers)
```

### 3.4 Tests de Microservicios (Día 7, 2 horas)

```bash
# Test health de todos los servicios
for port in {3101..3111}; do
  curl http://localhost:$port/health
done

# Test invoke analytics
curl -X POST http://localhost:3101/invoke \
  -H "Authorization: Bearer test" \
  -H "X-Correlation-Id: test-123" \
  -H "Content-Type: application/json" \
  -d '{"query": "sales trend", "data_source": "postgres", "time_range": {"from": "2025-01-01", "to": "2025-10-01"}}'
```

**Checkpoint 3:** Commit después de Microservicios
```bash
git add services/ docker-compose.dev.yml apps/api_py/
git commit -m "feat(services): 11 FastAPI microservices + proxy integration"
git push origin main
```

---

## FASE 4: GOBERNANZA IA (SEMANA 2, DÍA 1-4)
**Objetivo:** 0 → 70/100 en Governance (+10.5 pts)  
**Score Esperado:** 67.00 → 77.50

### 4.1 Human-in-the-Loop (HITL) (Día 1-2, 8 horas)

#### 4.1.1 Schema BD para HITL (`db/migrations/003-hitl.sql`)
```sql
CREATE TABLE hitl_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invocation_id UUID REFERENCES invocations(id),
  agent_id VARCHAR(50) REFERENCES agents(id),
  trigger_reason VARCHAR(100),  -- low_confidence, sensitive_data, policy_violation
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'timeout')),
  reviewer_id UUID REFERENCES users(id),
  decision_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);

CREATE INDEX idx_hitl_status ON hitl_requests(status) WHERE status = 'pending';
```

#### 4.1.2 Servicio HITL (`services/governance/hitl/app.py`)
```python
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import psycopg2

app = FastAPI(title="HITL Service")

class HITLRequest(BaseModel):
    invocation_id: str
    agent_id: str
    trigger_reason: str
    data: dict

@app.post("/request-review")
async def request_review(request: HITLRequest):
    """Crea una solicitud de revisión humana"""
    # Guardar en BD
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO hitl_requests (invocation_id, agent_id, trigger_reason)
        VALUES (%s, %s, %s)
        RETURNING id
    """, (request.invocation_id, request.agent_id, request.trigger_reason))
    hitl_id = cur.fetchone()[0]
    conn.commit()
    
    # TODO: Enviar notificación a Slack/Teams
    
    return {"hitl_id": hitl_id, "status": "pending"}

@app.get("/pending-reviews")
async def get_pending_reviews(reviewer_id: str):
    """Lista reviews pendientes para un revisor"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT h.*, i.input, i.output
        FROM hitl_requests h
        JOIN invocations i ON h.invocation_id = i.id
        WHERE h.status = 'pending'
        ORDER BY h.created_at ASC
    """)
    return [dict(row) for row in cur.fetchall()]

@app.post("/approve/{hitl_id}")
async def approve_review(hitl_id: str, reviewer_id: str, decision_data: dict):
    """Aprueba una solicitud HITL"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE hitl_requests
        SET status = 'approved', reviewer_id = %s, decision_data = %s, reviewed_at = NOW()
        WHERE id = %s
    """, (reviewer_id, decision_data, hitl_id))
    conn.commit()
    
    # TODO: Continuar la invocación original
    
    return {"status": "approved"}
```

#### 4.1.3 Frontend HITL en Cockpit (`apps/web/src/pages/HITL.tsx`)
```tsx
import { useEffect, useState } from 'react';

interface HITLRequest {
  id: string;
  agent_id: string;
  trigger_reason: string;
  input: any;
  output: any;
  created_at: string;
}

export function HITLPage() {
  const [pending, setPending] = useState<HITLRequest[]>([]);

  useEffect(() => {
    fetch('/api/hitl/pending-reviews?reviewer_id=current_user')
      .then(r => r.json())
      .then(setPending);
  }, []);

  const approve = async (hitlId: string) => {
    await fetch(`/api/hitl/approve/${hitlId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer_id: 'current_user', decision_data: {} })
    });
    setPending(prev => prev.filter(h => h.id !== hitlId));
  };

  return (
    <div>
      <h1>Human-in-the-Loop Reviews</h1>
      {pending.map(req => (
        <div key={req.id} style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem 0' }}>
          <h3>Agent: {req.agent_id}</h3>
          <p>Reason: {req.trigger_reason}</p>
          <pre>{JSON.stringify(req.input, null, 2)}</pre>
          <button onClick={() => approve(req.id)}>✅ Approve</button>
          <button onClick={() => reject(req.id)}>❌ Reject</button>
        </div>
      ))}
    </div>
  );
}
```

### 4.2 Data Loss Prevention (DLP) (Día 3, 4 horas)

#### 4.2.1 Servicio DLP (`services/governance/dlp/app.py`)
```python
from fastapi import FastAPI
import re

app = FastAPI(title="DLP Service")

# Patrones de datos sensibles
PATTERNS = {
    "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    "phone": r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
    "ssn": r'\b\d{3}-\d{2}-\d{4}\b',
    "credit_card": r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',
}

def scan_text(text: str) -> dict:
    """Escanea texto en busca de datos sensibles"""
    findings = {}
    for key, pattern in PATTERNS.items():
        matches = re.findall(pattern, text)
        if matches:
            findings[key] = len(matches)
    return findings

@app.post("/scan")
async def scan(payload: dict):
    """Escanea un payload completo"""
    text = str(payload)
    findings = scan_text(text)
    
    risk_level = "low"
    if len(findings) > 0:
        risk_level = "medium"
    if "ssn" in findings or "credit_card" in findings:
        risk_level = "high"
    
    return {
        "findings": findings,
        "risk_level": risk_level,
        "action": "block" if risk_level == "high" else "allow"
    }
```

#### 4.2.2 Integrar DLP en Proxy
```python
# En apps/api_py/server.py
def check_dlp(payload: dict) -> bool:
    """Verifica DLP antes de forward"""
    dlp_url = "http://localhost:4000/scan"
    resp = httpx.post(dlp_url, json=payload)
    result = resp.json()
    
    if result['action'] == 'block':
        raise HTTPException(403, f"DLP violation: {result['findings']}")
    
    if result['risk_level'] == 'medium':
        # Trigger HITL
        request_hitl_review(payload, reason="dlp_medium_risk")
    
    return True
```

### 4.3 FinOps (Día 4, 4 horas)

#### 4.3.1 Schema BD FinOps
```sql
CREATE TABLE cost_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invocation_id UUID REFERENCES invocations(id),
  agent_id VARCHAR(50),
  cost_usd DECIMAL(10, 6),
  tokens_input INTEGER,
  tokens_output INTEGER,
  model VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cost_tracking_agent_id ON cost_tracking(agent_id);
CREATE INDEX idx_cost_tracking_created_at ON cost_tracking(created_at);
```

#### 4.3.2 Servicio FinOps (`services/governance/finops/app.py`)
```python
from fastapi import FastAPI

app = FastAPI(title="FinOps Service")

COSTS_PER_1K_TOKENS = {
    "gpt-4": {"input": 0.03, "output": 0.06},
    "gpt-4-turbo": {"input": 0.01, "output": 0.03},
    "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
}

@app.post("/track-cost")
async def track_cost(invocation_id: str, agent_id: str, tokens_input: int, 
                     tokens_output: int, model: str):
    """Registra el costo de una invocación"""
    costs = COSTS_PER_1K_TOKENS.get(model, COSTS_PER_1K_TOKENS["gpt-4"])
    
    cost_usd = (
        (tokens_input / 1000) * costs["input"] +
        (tokens_output / 1000) * costs["output"]
    )
    
    # Guardar en BD
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO cost_tracking (invocation_id, agent_id, cost_usd, 
                                    tokens_input, tokens_output, model)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (invocation_id, agent_id, cost_usd, tokens_input, tokens_output, model))
    conn.commit()
    
    return {"cost_usd": cost_usd}

@app.get("/costs/daily")
async def get_daily_costs(date: str):
    """Obtiene costos diarios por agente"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT agent_id, SUM(cost_usd) as total_cost, COUNT(*) as invocations
        FROM cost_tracking
        WHERE DATE(created_at) = %s
        GROUP BY agent_id
    """, (date,))
    return [dict(row) for row in cur.fetchall()]
```

**Checkpoint 4:** Commit después de Gobernanza
```bash
git add services/governance/ db/migrations/ apps/web/src/pages/HITL.tsx
git commit -m "feat(governance): HITL + DLP + FinOps services"
git push origin main
```

---

## FASE 5: AUTENTICACIÓN & OBSERVABILIDAD (SEMANA 2-3, DÍA 5-10)
**Objetivo:** Auth 0→80 (+6.4 pts) + Observability 30→85 (+4.4 pts)  
**Score Esperado:** 77.50 → 88.30

### 5.1 Autenticación JWT (Día 5-6, 8 horas)

#### 5.1.1 Servicio Auth (`services/auth/app.py`)
```python
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.context import CryptContext
from datetime import datetime, timedelta
import os

app = FastAPI(title="Auth Service")
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(401, "Invalid token")

@app.post("/login")
async def login(email: str, password: str):
    """Login endpoint"""
    # TODO: Verificar contra BD
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, email, role, password_hash FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    
    if not user or not pwd_context.verify(password, user['password_hash']):
        raise HTTPException(401, "Invalid credentials")
    
    token = create_access_token({
        "sub": user['id'],
        "email": user['email'],
        "role": user['role']
    })
    
    return {"access_token": token, "token_type": "bearer"}

@app.get("/verify")
async def verify(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verifica un token JWT"""
    payload = verify_token(credentials.credentials)
    return payload
```

#### 5.1.2 Middleware Auth en Proxy
```python
# apps/api_py/server.py
def verify_auth_token(auth_header: str) -> dict:
    """Verifica token con servicio de auth"""
    token = auth_header.replace("Bearer ", "")
    resp = httpx.get("http://localhost:5000/verify", headers={
        "Authorization": f"Bearer {token}"
    })
    if resp.status_code != 200:
        raise HTTPException(401, "Invalid token")
    return resp.json()

# En do_POST:
user_data = verify_auth_token(auth_header)
user_id = user_data['sub']
```

### 5.2 OpenTelemetry (Día 7-8, 8 horas)

#### 5.2.1 Instrumentar Proxy Python
```python
# apps/api_py/server.py
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.requests import RequestsInstrumentor

# Setup OTLP
trace.set_tracer_provider(TracerProvider())
otlp_exporter = OTLPSpanExporter(endpoint="http://localhost:4317")
trace.get_tracer_provider().add_span_processor(BatchSpanProcessor(otlp_exporter))

tracer = trace.get_tracer(__name__)
RequestsInstrumentor().instrument()

# En do_POST:
with tracer.start_as_current_span("invoke_agent") as span:
    span.set_attribute("agent.id", agent_id)
    span.set_attribute("correlation.id", correlation_id)
    
    # ... procesar request ...
    
    span.set_attribute("response.status", "success")
```

#### 5.2.2 Instrumentar FastAPI Services
```python
# services/neuras/_template/app.py
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

tracer = trace.get_tracer(__name__)
FastAPIInstrumentor.instrument_app(app)

@app.post("/invoke")
async def invoke(request: InvokeRequest):
    with tracer.start_as_current_span("process_invocation") as span:
        span.set_attribute("area", "analytics")
        # ... lógica ...
```

#### 5.2.3 Jaeger para visualización
```yaml
# docker-compose.dev.yml
services:
  jaeger:
    image: jaegertracing/all-in-one:1.60
    ports:
      - "16686:16686"  # UI
      - "4317:4317"    # OTLP gRPC
      - "4318:4318"    # OTLP HTTP
    environment:
      - COLLECTOR_OTLP_ENABLED=true
```

### 5.3 Prometheus + Grafana (Día 9-10, 8 horas)

#### 5.3.1 Métricas en FastAPI
```python
# services/neuras/_template/app.py
from prometheus_client import Counter, Histogram, generate_latest

invocations_total = Counter('invocations_total', 'Total invocations', ['agent_id', 'status'])
invocation_duration = Histogram('invocation_duration_seconds', 'Invocation duration', ['agent_id'])

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")

@app.post("/invoke")
async def invoke(request: InvokeRequest):
    with invocation_duration.labels(agent_id="analytics").time():
        try:
            # ... procesar ...
            invocations_total.labels(agent_id="analytics", status="success").inc()
        except Exception as e:
            invocations_total.labels(agent_id="analytics", status="error").inc()
            raise
```

#### 5.3.2 Prometheus Config (`monitoring/prometheus.yml`)
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'neura-services'
    static_configs:
      - targets:
        - 'localhost:3101'  # analytics
        - 'localhost:3102'  # cdo
        # ... todos los microservicios
```

#### 5.3.3 Grafana Dashboards
```yaml
# docker-compose.dev.yml
services:
  prometheus:
    image: prom/prometheus:v2.54.1
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
  
  grafana:
    image: grafana/grafana:11.3.1
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
```

**Checkpoint 5:** Commit después de Auth + Observability
```bash
git add services/auth/ monitoring/ apps/api_py/
git commit -m "feat(auth+obs): JWT auth + OpenTelemetry + Prometheus/Grafana"
git push origin main
```

---

## FASE 6: POLISH & CI/CD (SEMANA 3, DÍA 11-14)
**Objetivo:** Pulir detalles y automatizar despliegues  
**Score Esperado:** 88.30 → 95.00+

### 6.1 Arreglar 138 Errores TypeScript (Día 11, 4 horas)

#### 6.1.1 Errores en `apps/cockpit/vitest.setup.ts`
```typescript
// Líneas 44-49: Corregir sintaxis
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
}));
```

#### 6.1.2 Errores de tipo React
```bash
# Asegurar versiones compatibles
pnpm add -D @types/react@18.3.12 @types/react-dom@18.3.1 -w
```

#### 6.1.3 Eliminar `as any` y `@ts-ignore`
```bash
# Buscar y reemplazar manualmente
grep -r "as any" apps/ packages/
grep -r "@ts-ignore" apps/ packages/
```

### 6.2 Cobertura de Tests a 80%+ (Día 12, 4 horas)

#### 6.2.1 Tests faltantes para microservicios
```python
# services/neuras/analytics/test_app.py
import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_invoke_analytics():
    response = client.post("/invoke", json={
        "query": "sales trend",
        "data_source": "postgres",
        "time_range": {"from": "2025-01-01", "to": "2025-10-01"}
    }, headers={
        "Authorization": "Bearer test",
        "X-Correlation-Id": "test-123"
    })
    assert response.status_code == 200
    assert "output" in response.json()
```

#### 6.2.2 Actualizar thresholds en `vitest.config.ts`
```typescript
coverage: {
  statements: 80,  // antes 50
  functions: 85,   // antes 75
  branches: 70,    // antes 45
  lines: 80,
}
```

### 6.3 CI/CD Completo (Día 13-14, 8 horas)

#### 6.3.1 GitHub Actions - Test & Build
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 8.15.5
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Lint
        run: pnpm -w lint
      
      - name: Typecheck
        run: pnpm -w typecheck
      
      - name: Test with coverage
        run: pnpm -w test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
```

#### 6.3.2 Docker Build & Push
```yaml
# .github/workflows/docker.yml
name: Docker Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service:
          - analytics
          - cdo
          - cfo
          # ... los 11 servicios
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./services/neuras/${{ matrix.service }}
          push: true
          tags: ghcr.io/econeura/neura-${{ matrix.service }}:latest
```

#### 6.3.3 Deploy a Azure (o AWS/GCP)
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  workflow_run:
    workflows: ["Docker Build"]
    types: [completed]
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Azure Login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy to AKS
        run: |
          az aks get-credentials --resource-group econeura-rg --name econeura-cluster
          kubectl set image deployment/neura-analytics neura-analytics=ghcr.io/econeura/neura-analytics:latest
          kubectl rollout status deployment/neura-analytics
```

### 6.4 Documentación Final (Día 14, 2 horas)

#### 6.4.1 API Documentation con OpenAPI
```python
# Cada microservicio FastAPI genera docs automáticamente en /docs
# Agregar descripciones detalladas:

@app.post("/invoke", 
          summary="Invoke analytics agent",
          description="Processes an analytics query and returns insights",
          response_description="Analysis results with metadata")
async def invoke(request: AnalyticsRequest):
    ...
```

#### 6.4.2 Actualizar README.md
```markdown
# ECONEURA - 100% GA Production Ready ✅

## Quick Start
```bash
git clone https://github.com/ECONEURA/ECONEURA-.git
cd ECONEURA-
pnpm install
docker compose -f docker-compose.dev.yml up -d
pnpm -w dev
```

## Architecture
- **Frontend:** React 18 + Vite (port 3000)
- **Proxy API:** Python stdlib (port 8080)
- **11 Microservices:** FastAPI (ports 3101-3111)
- **Database:** PostgreSQL 16 + RLS
- **Auth:** JWT with role-based access
- **Observability:** OpenTelemetry + Jaeger + Prometheus + Grafana
- **Governance:** HITL + DLP + FinOps

## Deployment
Production: Azure AKS  
CI/CD: GitHub Actions  
Monitoring: Grafana Cloud
```

**Checkpoint 6 FINAL:** Commit & Tag v1.0.0
```bash
git add .
git commit -m "feat: ECONEURA 100% GA - all systems operational"
git tag -a v1.0.0 -m "First production-ready release"
git push origin main --tags
```

---

## CRONOGRAMA RESUMIDO

```
┌─────────────────────────────────────────────────────────────┐
│ SEMANA 1                                                    │
├─────────────────────────────────────────────────────────────┤
│ Día 1  │ Fase 1: Quick Wins (1h)                           │
│ Día 1  │ Fase 2: Postgres Setup (4h)                       │
│ Día 2  │ Fase 2: Python Client + Integration (4h)          │
│ Día 3  │ Fase 2: Seeds + Tests (4h)                        │
│ Día 4  │ Fase 3: FastAPI Template (3h)                     │
│ Día 5  │ Fase 3: Implementar Servicios (6h)                │
│ Día 6  │ Fase 3: Finalizar Servicios (6h)                  │
│ Día 7  │ Fase 3: Proxy Integration + Tests (6h)            │
├─────────────────────────────────────────────────────────────┤
│ SEMANA 2                                                    │
├─────────────────────────────────────────────────────────────┤
│ Día 8  │ Fase 4: HITL (4h)                                 │
│ Día 9  │ Fase 4: HITL Frontend (4h)                        │
│ Día 10 │ Fase 4: DLP (4h)                                  │
│ Día 11 │ Fase 4: FinOps (4h)                               │
│ Día 12 │ Fase 5: JWT Auth (4h)                             │
│ Día 13 │ Fase 5: Auth Integration (4h)                     │
│ Día 14 │ Fase 5: OpenTelemetry (4h)                        │
├─────────────────────────────────────────────────────────────┤
│ SEMANA 3                                                    │
├─────────────────────────────────────────────────────────────┤
│ Día 15 │ Fase 5: Prometheus/Grafana (4h)                   │
│ Día 16 │ Fase 6: TypeScript Fixes (4h)                     │
│ Día 17 │ Fase 6: Test Coverage 80% (4h)                    │
│ Día 18 │ Fase 6: CI/CD Setup (4h)                          │
│ Día 19 │ Fase 6: Deploy Pipeline (4h)                      │
│ Día 20 │ Fase 6: Documentation + Tag v1.0.0 (2h)           │
└─────────────────────────────────────────────────────────────┘

Total: ~96 horas (12 días de 8h o 3 semanas de 32h)
```

---

## SCORE PROGRESSION

```
Inicio:          43.25/100 ■■■■■■■■■□□□□□□□□□□□

Fase 1 (Quick):  48.25/100 ■■■■■■■■■■□□□□□□□□□□
Fase 2 (DB):     60.25/100 ■■■■■■■■■■■■□□□□□□□□
Fase 3 (Micro):  67.00/100 ■■■■■■■■■■■■■■□□□□□□
Fase 4 (Gov):    77.50/100 ■■■■■■■■■■■■■■■■□□□□
Fase 5 (Auth):   88.30/100 ■■■■■■■■■■■■■■■■■■□□
Fase 6 (Polish): 95.00/100 ■■■■■■■■■■■■■■■■■■■□

Target: 95+/100 ✅
```

---

## CRITERIOS DE ÉXITO (Definition of Done)

### ✅ Para considerar ECONEURA al 100%:

1. **Backend:**
   - [x] Postgres operacional con schemas + RLS
   - [x] 11 microservicios FastAPI funcionales
   - [x] Proxy Python enrutando correctamente

2. **Gobernanza:**
   - [x] HITL con UI funcional para reviewers
   - [x] DLP escaneando datos sensibles
   - [x] FinOps trackeando costos por invocación

3. **Seguridad:**
   - [x] JWT auth con roles (admin/manager/analyst/viewer)
   - [x] RLS implementado en todas las tablas sensibles
   - [x] Secrets gestionados con variables de entorno

4. **Observabilidad:**
   - [x] OpenTelemetry traces en todos los servicios
   - [x] Prometheus metrics expuestos
   - [x] Grafana dashboards con alertas

5. **Calidad:**
   - [x] 0 errores TypeScript
   - [x] Cobertura de tests ≥ 80%
   - [x] Lint passing con `--max-warnings 0`

6. **CI/CD:**
   - [x] GitHub Actions ejecutando tests en cada PR
   - [x] Docker images construyéndose automáticamente
   - [x] Deploy a staging automático en merge a main

7. **Documentación:**
   - [x] README.md actualizado con arquitectura real
   - [x] OpenAPI docs en todos los microservicios
   - [x] Runbook de troubleshooting

---

## CONTINGENCIAS

### Si algo falla, aplicar:
1. **No bloquear:** Documentar el issue y continuar
2. **Fallback:** Mantener Make.com como backup si microservicios fallan
3. **Rollback:** Tags Git permiten volver a estado anterior
4. **Comunicar:** Actualizar ROADMAP_TO_100.md con blockers reales

### Riesgos identificados:
- **Postgres setup en Windows:** Usar Docker obligatoriamente
- **TypeScript errors persistentes:** Priorizar los críticos primero
- **Microservicios lentos:** Implementar cache Redis si necesario
- **CI/CD pipelines largos:** Paralelizar jobs de test

---

## LECCIONES APRENDIDAS APLICADAS

Del archivo `docs/BRUTAL_SELF_CRITICISM.md`:

1. ✅ **No bloquear en comandos que fallan:** Usar fallbacks y documentar
2. ✅ **No asumir:** Verificar con herramientas (grep, file_search) antes
3. ✅ **Commits pequeños y frecuentes:** Checkpoint después de cada fase
4. ✅ **Tests desde el inicio:** No dejar para el final
5. ✅ **Documentación honesta:** ARCHITECTURE_REALITY.md actualizado siempre

---

## COMANDOS RÁPIDOS DE REFERENCIA

```bash
# Desarrollo local
pnpm install                          # Instalar deps
docker compose up -d                  # Levantar Postgres + servicios
pnpm -w dev                           # Iniciar frontend + proxy

# Tests & Quality
pnpm -w lint                          # ESLint
pnpm -w typecheck                     # TypeScript
pnpm -w test                          # Vitest
pnpm -w test:coverage                 # Con cobertura

# Base de datos
docker compose exec postgres psql -U econeura -d econeura_dev
# \dt - listar tablas
# SELECT * FROM agents;

# Logs microservicios
docker compose logs -f neura-analytics

# Rebuild todo
pnpm -w build
docker compose build --no-cache

# Deploy
git tag -a v1.0.0 -m "Release"
git push origin main --tags
```

---

## PRÓXIMOS PASOS INMEDIATOS

**AHORA (después de este commit):**

1. Commit de este ACTION_PLAN
2. Merge/fusión con main
3. **Iniciar Fase 5** (Auth + Observability)
4. Checkpoint cada 4 horas
5. Llegar a 95+ en 6 semanas

**Comando para empezar Fase 5:**
```bash
git checkout -b feat/auth-observability
mkdir -p services/auth
touch services/auth/app.py
# ... seguir pasos de Fase 5.1 ...
```

---

**FIN DEL PLAN DE ACCIÓN**

Score Objetivo: **95+/100** ✅  
Tiempo Estimado: **6 semanas (96 horas efectivas)**  
Fecha Límite: **18 noviembre 2025**

_"Aprendiendo de los errores, trabajando con eficiencia, sin bloqueos."_ 🚀
