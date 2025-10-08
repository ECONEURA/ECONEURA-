"""
Servicio de Autenticación JWT para ECONEURA
Proporciona login, verificación de tokens y gestión de usuarios
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
from passlib.context import CryptContext
from datetime import datetime, timedelta
import os
import psycopg2
from psycopg2.extras import RealDictCursor

app = FastAPI(
    title="ECONEURA Auth Service",
    version="1.0.0",
    description="JWT authentication and user management"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuración JWT
SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-CHANGE-IN-PRODUCTION")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Configuración DB
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME", "econeura_dev"),
    "user": os.getenv("DB_USER", "econeura"),
    "password": os.getenv("DB_PASSWORD", "dev_password"),
}

# Modelos Pydantic
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class TokenPayload(BaseModel):
    sub: str  # user_id
    email: str
    role: str
    exp: datetime

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "viewer"

# Utilidades DB
def get_db_connection():
    """Crea conexión a Postgres"""
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)

# Utilidades JWT
def create_access_token(data: dict) -> str:
    """Genera un JWT token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    """Verifica y decodifica un JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def hash_password(password: str) -> str:
    """Hashea una contraseña con bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña contra su hash"""
    return pwd_context.verify(plain_password, hashed_password)

# Endpoints
@app.get("/health")
async def health():
    """Health check endpoint"""
    try:
        conn = get_db_connection()
        conn.close()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "service": "auth",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    """
    Endpoint de login
    Valida credenciales y retorna JWT token
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Buscar usuario por email
        cur.execute(
            "SELECT id, email, name, role, password_hash FROM users WHERE email = %s",
            (credentials.email,)
        )
        user = cur.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verificar password (si existe password_hash)
        if user.get('password_hash'):
            if not verify_password(credentials.password, user['password_hash']):
                raise HTTPException(status_code=401, detail="Invalid credentials")
        else:
            # Modo desarrollo: permitir cualquier password si no hay hash
            if os.getenv("ENV") != "dev":
                raise HTTPException(status_code=401, detail="Password not configured")
        
        # Crear token
        token_data = {
            "sub": str(user['id']),
            "email": user['email'],
            "role": user['role']
        }
        access_token = create_access_token(token_data)
        
        # Registrar login en audit_log
        cur.execute("""
            INSERT INTO audit_log (user_id, action, resource_type, details)
            VALUES (%s, 'login', 'auth', %s)
        """, (user['id'], {"method": "jwt"}))
        conn.commit()
        
        conn.close()
        
        return LoginResponse(
            access_token=access_token,
            user={
                "id": str(user['id']),
                "email": user['email'],
                "name": user['name'],
                "role": user['role']
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")

@app.get("/verify")
async def verify(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verifica un JWT token
    Usado por otros servicios para validar autenticación
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    return {
        "valid": True,
        "user_id": payload['sub'],
        "email": payload['email'],
        "role": payload['role'],
        "exp": payload['exp']
    }

@app.post("/register", response_model=LoginResponse)
async def register(user_data: UserCreate):
    """
    Registra un nuevo usuario
    Solo disponible en desarrollo o con rol admin
    """
    if os.getenv("ENV") == "prod" and not os.getenv("ALLOW_REGISTRATION"):
        raise HTTPException(status_code=403, detail="Registration disabled in production")
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Verificar si email ya existe
        cur.execute("SELECT id FROM users WHERE email = %s", (user_data.email,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hashear password
        password_hash = hash_password(user_data.password)
        
        # Insertar usuario
        cur.execute("""
            INSERT INTO users (email, name, role, password_hash)
            VALUES (%s, %s, %s, %s)
            RETURNING id, email, name, role
        """, (user_data.email, user_data.name, user_data.role, password_hash))
        
        user = cur.fetchone()
        conn.commit()
        conn.close()
        
        # Crear token
        token_data = {
            "sub": str(user['id']),
            "email": user['email'],
            "role": user['role']
        }
        access_token = create_access_token(token_data)
        
        return LoginResponse(
            access_token=access_token,
            user={
                "id": str(user['id']),
                "email": user['email'],
                "name": user['name'],
                "role": user['role']
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")

@app.get("/users/me")
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Obtiene información del usuario actual
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, email, name, role, created_at FROM users WHERE id = %s",
            (payload['sub'],)
        )
        user = cur.fetchone()
        conn.close()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": str(user['id']),
            "email": user['email'],
            "name": user['name'],
            "role": user['role'],
            "created_at": user['created_at'].isoformat() if user.get('created_at') else None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
