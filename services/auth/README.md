# ECONEURA Auth Service

Servicio de autenticación basado en JWT para el ecosistema ECONEURA.

## Características

- ✅ Login con email/password
- ✅ JWT tokens con expiración configurable
- ✅ Verificación de tokens para otros servicios
- ✅ Registro de usuarios (configurable)
- ✅ Bcrypt para hashing de passwords
- ✅ Audit log de accesos
- ✅ Health checks

## Variables de Entorno

```bash
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=econeura_dev
DB_USER=econeura
DB_PASSWORD=dev_password

# JWT
JWT_SECRET=your-secret-key-CHANGE-IN-PROD
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Entorno
ENV=dev  # o 'prod'
ALLOW_REGISTRATION=1  # permitir registro en producción
```

## Desarrollo Local

```bash
# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
python app.py
# O con uvicorn:
uvicorn app:app --reload --port 5000
```

## Endpoints

### `POST /login`
Login con credenciales:
```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@econeura.com", "password": "admin123"}'
```

Respuesta:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "admin@econeura.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

### `GET /verify`
Verificar token:
```bash
curl http://localhost:5000/verify \
  -H "Authorization: Bearer <token>"
```

### `GET /users/me`
Obtener info del usuario actual:
```bash
curl http://localhost:5000/users/me \
  -H "Authorization: Bearer <token>"
```

### `POST /register`
Registrar nuevo usuario (solo dev o con flag):
```bash
curl -X POST http://localhost:5000/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new@econeura.com",
    "name": "New User",
    "password": "secure123",
    "role": "analyst"
  }'
```

## Docker

```bash
# Build
docker build -t econeura-auth .

# Run
docker run -p 5000:5000 \
  -e DB_HOST=postgres \
  -e JWT_SECRET=my-secret \
  econeura-auth
```

## Tests

```bash
# Unit tests
pytest test_app.py -v

# Integration test
./test_auth_flow.sh
```

## Integración con otros servicios

Otros microservicios pueden verificar tokens llamando a `/verify`:

```python
import httpx

def verify_auth(token: str) -> dict:
    resp = httpx.get(
        "http://auth-service:5000/verify",
        headers={"Authorization": f"Bearer {token}"}
    )
    resp.raise_for_status()
    return resp.json()
```

## Roles disponibles

- `admin`: Acceso completo
- `manager`: Gestión de equipo
- `analyst`: Uso de agentes
- `viewer`: Solo lectura

## Seguridad

- Passwords hasheados con bcrypt (cost factor 12)
- Tokens JWT firmados con HS256
- CORS configurable
- Audit log de todos los accesos
- Rate limiting (TODO)
- MFA opcional (TODO)
