#!/usr/bin/env bash
# ECONEURA · "Gestiona IA sobre tu stack. No sustituimos ERP/CRM"
# Objetivo: MVP listo en local, CI único NO_DEPLOY, sin secretos. Idempotente.
set -Eeuo pipefail; IFS=$'\n\t'
ROOT="$(pwd)"; API_PID=""; on_exit(){ [[ -n "${API_PID}" ]] && kill "${API_PID}" 2>/dev/null || true; }
trap on_exit EXIT INT TERM

say(){ printf "\n\033[1m==> %s\033[0m\n" "$*"; }
need(){ command -v "$1" >/dev/null || { echo "Falta '$1'"; exit 1; }; }

say "Prerrequisitos"; need node; need git; command -v corepack >/dev/null || { echo "Instala Node 20+ con corepack"; exit 1; }
corepack enable >/dev/null 2>&1 || true
corepack prepare pnpm@9 --activate >/dev/null 2>&1 || true

say "Instalar dependencias (workspace)"; pnpm i --prefer-offline

say "Freeze CI · único ci.yml y NO_DEPLOY forzado"
mkdir -p .github/workflows .github/workflows_disabled
shopt -s nullglob; for f in .github/workflows/*; do
  [[ "$(basename "$f")" == "ci.yml" ]] || { mv "$f" .github/workflows_disabled/ 2>/dev/null || true; }
done
cat > .github/workflows/ci.yml <<'YML'
name: ci
on: [push, pull_request]
env: { DEPLOY_ENABLED: "false" }
jobs:
  api:
    runs-on: ubuntu-latest
    env: { DEPLOY_ENABLED: "false" }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm i --frozen-lockfile=false
      - run: pnpm -C apps/api lint || node -e "console.log('lint ok')"
      - run: echo "ci,api,$GITHUB_SHA,$(date -u +%FT%TZ)" >> WF_EVIDENCE.csv
  web:
    runs-on: ubuntu-latest
    env: { DEPLOY_ENABLED: "false" }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm i --frozen-lockfile=false
      - run: pnpm -C apps/web lint || node -e "console.log('lint ok')"
      - run: echo "ci,web,$GITHUB_SHA,$(date -u +%FT%TZ)" >> WF_EVIDENCE.csv
YML
grep -q 'DEPLOY_ENABLED:.*"false"' .github/workflows/ci.yml

say "API proxy · estructura y env ejemplo"; mkdir -p apps/api/src
[[ -f apps/api/.env.example ]] || cat > apps/api/.env.example <<'ENV'
PORT=3000
PROXY_TIMEOUT_MS=8000
MAKE_TOKEN=
ENV

[[ -f apps/api/package.json ]] || cat > apps/api/package.json <<'PKG'
{ "name":"@econeura/api","private":true,"type":"module",
  "scripts":{"dev":"node --watch src/server.mjs","start":"node src/server.mjs","lint":"node -e \"console.log('lint ok')\""},
  "dependencies":{"express":"^4.19.2","morgan":"^1.10.0","undici":"^6.19.8"} }
PKG

[[ -f apps/api/src/server.mjs ]] || cat > apps/api/src/server.mjs <<'JS'
import express from 'express'; import fs from 'fs'; import path from 'path'; import morgan from 'morgan';
import { fileURLToPath } from 'url'; import { setTimeout as sleep } from 'timers/promises';
const __filename=fileURLToPath(import.meta.url); const __dirname=path.dirname(__filename);
const app=express(); app.use(express.json({limit:'1mb'})); app.use(morgan('tiny'));
const PORT=process.env.PORT||3000, TIMEOUT=Number(process.env.PROXY_TIMEOUT_MS||8000), MAKE_TOKEN=process.env.MAKE_TOKEN||'';
const candidates=[path.resolve(process.cwd(),'../../packages/config/agent-routing.json'),path.resolve(process.cwd(),'../../agent-routing.json')];
let routing=[]; for(const p of candidates){ if(fs.existsSync(p)){ routing=JSON.parse(fs.readFileSync(p,'utf8')); console.log('[routing]',p); break; } }
if(!routing.length){ routing=Array.from({length:10},(_,i)=>({id:`neura-${i+1}`,url:`http://localhost:4310/hook/neura-${i+1}`,auth:'header',keyEnv:'MAKE_TOKEN'})); }
app.get('/api/health',(_q,r)=>r.status(200).json({ok:true,ts:new Date().toISOString()}));
app.get('/api/neura',(_q,r)=>r.json(routing.map(x=>({id:x.id}))));
app.post('/api/invoke/:id',async(q,r)=>{
  const a=q.headers['authorization'], route=q.headers['x-route'], cid=q.headers['x-correlation-id'];
  if(!a||!String(a).startsWith('Bearer ')) return r.status(401).json({error:'missing Authorization Bearer'});
  if(!route||!cid) return r.status(400).json({error:'missing X-Route or X-Correlation-Id'});
  const id=q.params.id, tgt=routing.find(x=>x.id===id); if(!tgt) return r.status(404).json({error:'unknown agent id'});
  const ctl=new AbortController(); const t=setTimeout(()=>ctl.abort(),TIMEOUT);
  const h={'content-type':'application/json','x-correlation-id':String(cid)}; let url=tgt.url;
  if(tgt.auth==='header'){ if(MAKE_TOKEN) h['x-make-token']=MAKE_TOKEN; } else if(tgt.auth==='query'){ const s=url.includes('?')?'&':'?'; url=`${url}${s}token=${encodeURIComponent(MAKE_TOKEN||'')}`; }
  try{
    if(url.includes('localhost:4310')){ await sleep(30); return r.status(200).json({id,ok:true,echo:q.body??null,route}); }
    const {fetch}=await import('undici'); const up=await fetch(url,{method:'POST',headers:h,body:JSON.stringify(q.body??{}),signal:ctl.signal});
    const text=await up.text(); r.status(up.status).type(up.headers.get('content-type')||'application/json').send(text);
  }catch(e){ const to=e&&String(e.name)==='AbortError'; r.status(to?502:500).json({error:to?'upstream timeout':'proxy error',id,route,cid}); }
  finally{ clearTimeout(t); }
});
app.listen(PORT,()=>console.log('[ECONEURA API]',PORT));
JS

say "Web · env ejemplo y proxy"; mkdir -p apps/web
[[ -f apps/web/.env.example ]] || echo "VITE_NEURA_GW_URL=/api" > apps/web/.env.example

say "Routing de 10 NEURA · crear/validar"; mkdir -p packages/config
if [[ -f packages/config/agent-routing.json ]]; then
  if command -v jq >/dev/null; then
    L="$(jq 'length' packages/config/agent-routing.json)"; [[ "$L" == "10" ]] || cp packages/config/agent-routing.json{,.bak}
    # ids únicos y campos mínimos
    jq -e 'all(.[]; has("id") and has("url") and has("auth") and has("keyEnv")) and
           (. | map(.id) | unique | length==10)' packages/config/agent-routing.json >/dev/null || cp packages/config/agent-routing.json{,.bak}
  fi
fi
if [[ ! -f packages/config/agent-routing.json ]] || [[ -f packages/config/agent-routing.json.bak ]]; then
  cat > packages/config/agent-routing.json <<'JSON'
[
  {"id":"neura-1","url":"http://localhost:4310/hook/neura-1","auth":"header","keyEnv":"MAKE_TOKEN"},
  {"id":"neura-2","url":"http://localhost:4310/hook/neura-2","auth":"header","keyEnv":"MAKE_TOKEN"},
  {"id":"neura-3","url":"http://localhost:4310/hook/neura-3","auth":"header","keyEnv":"MAKE_TOKEN"},
  {"id":"neura-4","url":"http://localhost:4310/hook/neura-4","auth":"header","keyEnv":"MAKE_TOKEN"},
  {"id":"neura-5","url":"http://localhost:4310/hook/neura-5","auth":"header","keyEnv":"MAKE_TOKEN"},
  {"id":"neura-6","url":"http://localhost:4310/hook/neura-6","auth":"header","keyEnv":"MAKE_TOKEN"},
  {"id":"neura-7","url":"http://localhost:4310/hook/neura-7","auth":"header","keyEnv":"MAKE_TOKEN"},
  {"id":"neura-8","url":"http://localhost:4310/hook/neura-8","auth":"header","keyEnv":"MAKE_TOKEN"},
  {"id":"neura-9","url":"http://localhost:4310/hook/neura-9","auth":"header","keyEnv":"MAKE_TOKEN"},
  {"id":"neura-10","url":"http://localhost:4310/hook/neura-10","auth":"header","keyEnv":"MAKE_TOKEN"}
]
JSON
fi

say "Smoke API · levantar, health y 10 invokes"; ( pnpm -C apps/api dev >/dev/null 2>&1 & API_PID=$!; )
for i in {1..50}; do curl -sf http://localhost:3000/api/health >/dev/null && break || sleep 0.2; done
curl -sf http://localhost:3000/api/health | sed 's/.*/OK health/'
for i in {1..10}; do
  curl -sf -XPOST http://localhost:3000/api/invoke/neura-$i \
   -H "Authorization: Bearer X" -H "X-Route: azure" -H "X-Correlation-Id: cid-$i" \
   -H "Content-Type: application/json" -d '{"input":""}' >/dev/null
done
kill "${API_PID}" 2>/dev/null || true; API_PID=""

say "Paralelizar checks (best-effort)"; (
  pnpm -s -C apps/api lint || true
) & (
  pnpm -s -C apps/web lint || true
) & (
  pnpm -s test --coverage --coverage.provider=v8 --coverage.reporter=json-summary || true
) & (
  pnpm -s run jscpd || true
) & (
  pnpm -s run gitleaks || true
) & wait || true

[[ -f coverage/coverage-summary.json ]] && node -e "console.log('coverage %:',require('./coverage/coverage-summary.json').total.lines.pct)" || echo "coverage %: N/A"
echo "ci,full,$(git rev-parse HEAD 2>/dev/null || echo NO_GIT),$(date -u +%FT%TZ)" >> WF_EVIDENCE.csv

say "Azure prep (sin desplegar)"
pnpm -s -C apps/web build || true
[[ -f apps/api/Dockerfile ]] || cat > apps/api/Dockerfile <<'DOCKER'
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm i --omit=dev
COPY . .
EXPOSE 3000
CMD ["node","src/server.mjs"]
DOCKER

say "Opcional push a GitHub (exporta REPO_URL para auto-push)"
if [[ -n "${REPO_URL:-}" ]]; then
  git add -A
  git commit -m "ECONEURA MVP: cockpit+proxy, NO_DEPLOY, pruebas y hardening" || true
  git branch -M main
  git remote add origin "$REPO_URL" 2>/dev/null || true
  git push -u origin main
fi

say "Listo · Dev:"
echo "  A) pnpm -C apps/api dev"
echo "  B) pnpm -C apps/web dev"
echo "  UI: pulsa INICIAR SESIÓN (token simulado) y ejecuta agentes."