# ✅ VERIFICACIÓN RÁPIDA: Workflows en Verde

## 🎯 Estado Actual (Post-Rewrite)

### **Workflows Activos:**
1. ✅ `ci-basic.yml` - Lint + Typecheck
2. ✅ `build-web.yml` - Build Web App
3. ✅ `validate-api.yml` - Validate Python API
4. ✅ `deploy-azure.yml` - Deploy (condicional)

### **Workflows Deshabilitados:**
- `ci.yml.OLD`
- `ci-smoke.yml.OLD`
- `deploy-web.yml.OLD`
- `deploy-api.yml.OLD`

---

## 🧪 TEST LOCAL (Ejecutar ANTES de ver GitHub Actions)

### **Test 1: CI Basic** ✅
```bash
cd c:\Users\Usuario\OneDrive\Documents\GitHub\ECONEURA-
pnpm install --frozen-lockfile
pnpm -w run typecheck
pnpm -w run lint
```
**Resultado esperado:** Ambos commands pasan sin errores

### **Test 2: Build Web** ✅
```bash
cd c:\Users\Usuario\OneDrive\Documents\GitHub\ECONEURA-\apps\web
pnpm install
pnpm run build
ls dist\index.html
```
**Resultado esperado:** `dist/index.html` existe

### **Test 3: Validate API** ✅
```bash
cd c:\Users\Usuario\OneDrive\Documents\GitHub\ECONEURA-\apps\api_py
python -m py_compile server.py
python -c "import server; print(server.ROUTES)"
```
**Resultado esperado:** Sin errores, imprime lista de rutas

---

## 🚀 PRÓXIMOS PASOS

### **1. Push y Verificar en GitHub** (AHORA)
```bash
git push origin main
```

Luego ve a: https://github.com/ECONEURA/ECONEURA-/actions

**Deberías ver:**
- ✅ CI Basic - Running/Completed (GREEN)
- ✅ Build Web App - Running/Completed (GREEN)
- ✅ Validate Python API - Running/Completed (GREEN)
- ⚠️ Deploy to Azure - Waiting (needs secrets)

### **2. Configurar Secrets** (SI QUIERES DEPLOY)

**Opción A: Via Web UI**
1. Ve a: https://github.com/ECONEURA/ECONEURA-/settings/secrets/actions
2. Click "New repository secret"
3. Name: `AZURE_WEBAPP_PUBLISH_PROFILE_WEB`
4. Value: (XML del Azure Portal → App Service → Get Publish Profile)
5. Repetir para `AZURE_WEBAPP_PUBLISH_PROFILE_API`

**Opción B: Via CLI (si tienes az + gh)**
```bash
az webapp deployment list-publishing-profiles \
  -g appsvc_linux_northeurope_basic \
  -n econeura-web-dev \
  --xml | gh secret set AZURE_WEBAPP_PUBLISH_PROFILE_WEB

az webapp deployment list-publishing-profiles \
  -g appsvc_linux_northeurope_basic \
  -n econeura-api-dev \
  --xml | gh secret set AZURE_WEBAPP_PUBLISH_PROFILE_API
```

### **3. Trigger Deploy** (DESPUÉS DE SECRETS)
```bash
# Opción A: Auto-trigger con push
git commit --allow-empty -m "ci: trigger deployment with secrets"
git push origin main

# Opción B: Manual en GitHub
# Actions → Deploy to Azure → Run workflow → Choose target
```

---

## 📊 RESULTADO ESPERADO

### **Sin Secrets (estado actual):**
```
✅ CI Basic (lint + typecheck)       - PASSED ✅
✅ Build Web App                      - PASSED ✅
✅ Validate Python API                - PASSED ✅
⏭️ Deploy to Azure                    - SKIPPED (no secrets)
```

### **Con Secrets (después de configurar):**
```
✅ CI Basic (lint + typecheck)       - PASSED ✅
✅ Build Web App                      - PASSED ✅
✅ Validate Python API                - PASSED ✅
✅ Deploy to Azure (Web)              - PASSED ✅
✅ Deploy to Azure (API)              - PASSED ✅
```

---

## 🔍 TROUBLESHOOTING

### **Si CI Basic falla:**
```bash
# Verificar que los comandos existen
cat package.json | grep -A 5 "scripts"
# Debe tener: "typecheck" y "lint"
```

### **Si Build Web falla:**
```bash
# Verificar estructura de apps/web
ls apps/web/package.json
cat apps/web/package.json | grep build
# Debe tener: "build": "vite build"
```

### **Si Validate API falla:**
```bash
# Verificar server.py
python -c "import sys; sys.path.insert(0, 'apps/api_py'); import server"
# Si falla, revisar imports en server.py
```

### **Si Deploy falla (con secrets):**
1. Verificar que secrets están en: Settings → Secrets → Actions
2. Verificar nombres exactos:
   - `AZURE_WEBAPP_PUBLISH_PROFILE_WEB`
   - `AZURE_WEBAPP_PUBLISH_PROFILE_API`
3. Verificar que el XML es válido (copiar completo desde Azure)

---

## ✅ CHECKLIST COMPLETO

- [x] Workflows viejos renombrados a .OLD
- [x] Workflows nuevos activados
- [x] Commit realizado
- [ ] Push a GitHub main
- [ ] Verificar CI Basic en Actions (debe estar verde)
- [ ] Verificar Build Web en Actions (debe estar verde)
- [ ] Verificar Validate API en Actions (debe estar verde)
- [ ] (Opcional) Configurar secrets
- [ ] (Opcional) Verificar Deploy en Actions

---

## 📞 COMANDO FINAL

**Ejecuta esto AHORA para push:**
```bash
git push origin main
```

Luego monitorea: https://github.com/ECONEURA/ECONEURA-/actions

**Espera resultado:**
- 3 workflows verdes ✅
- 0 workflows rojos ❌
- 1 workflow opcional (deploy)
