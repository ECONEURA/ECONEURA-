# ECONEURA Setup Guide

## Requisitos del Sistema

### Hardware Mínimo
- RAM: 4GB
- CPU: 2 cores
- Disco: 2GB libre

### Software Requerido
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 20.0+ (proporcionado por dev container)
- **pnpm**: 8.15+ (proporcionado por dev container)

## Opciones de Setup

### Opción 1: Dev Container (Recomendado)
```bash
# En VS Code
Ctrl+Shift+P → "Dev Containers: Reopen in Container"
# Seleccionar: ECONEURA Development Container
```

### Opción 2: Docker Compose Manual
```bash
# Levantar todos los servicios
docker-compose -f docker-compose.dev.yml up -d

# Verificar servicios
docker ps

# Conectar a contenedor
docker exec -it <container_id> bash
```

### Opción 3: Instalación Local (No Recomendado)
```bash
# Instalar Node.js 20+
# Instalar pnpm
# Instalar PostgreSQL localmente
# Instalar Redis localmente
```

## Servicios Requeridos

### Base de Datos
- **PostgreSQL**: Puerto 5432
- **Redis**: Puerto 6379
- **PgAdmin**: Puerto 5050 (opcional)

### Aplicaciones
- **API**: Puerto 3101
- **Web**: Puerto 3000
- **Cockpit**: Puerto variable

## Verificación del Setup

```bash
# Ejecutar validación automática
./scripts/core/validate-environment.sh

# Verificar servicios
curl http://localhost:5432  # PostgreSQL
curl http://localhost:6379  # Redis
curl http://localhost:3000  # Web app
curl http://localhost:3101  # API
```

## Troubleshooting

### Error: "docker command not found"
```bash
# Instalar Docker
# Linux: https://docs.docker.com/engine/install/
# macOS: brew install docker
# Windows: https://docs.docker.com/desktop/install/windows/
```

### Error: "Permission denied"
```bash
# Agregar usuario a grupo docker
sudo usermod -aG docker $USER
# Reiniciar sesión
```

### Error: "Port already in use"
```bash
# Verificar qué usa el puerto
lsof -i :5432
# Matar proceso o cambiar puerto
```

## Comandos Útiles

```bash
# Ver logs de servicios
docker-compose logs -f

# Reiniciar servicios
docker-compose restart

# Limpiar todo
docker-compose down -v --remove-orphans
```
