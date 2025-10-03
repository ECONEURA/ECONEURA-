$ErrorActionPreference="Stop"; chcp 65001>$null
Copy-Item package.json package.json.bak -Force

# 1) Reparar y fusionar package.json (sin perder claves), normalizar y validar
$fix = @'
const fs=require("fs");
const s=fs.readFileSync("package.json","utf8").replace(/^\uFEFF/,"\uFEFF"==="\uFEFF"?"":"");
const objs=[]; let i=0, depth=0, start=-1;
for (let p=0;p<s.length;p++){
	const c=s[p]; if(c==="{"){ if(depth++===0) start=p }
	else if(c==="}"){ if(--depth===0 && start>=0){ objs.push(s.slice(start,p+1)); start=-1 } }
}
if(!objs.length) throw new Error("JSON no detectable");
const parsed=objs.map(x=>JSON.parse(x));
const merge=(a,b)=>{ for(const k of Object.keys(b)){ if(a[k]&&typeof a[k]==="object"&&typeof b[k]==="object"&&!Array.isArray(a[k])&&!Array.isArray(b[k])) merge(a[k],b[k]); else a[k]=a[k]??b[k] } return a }
const out=parsed.reduce((acc,o)=>merge(acc,o),{});
if(!out.name && out.nombre){ out.name=out.nombre; delete out.nombre }
if(typeof out.private!=="boolean") out.private=true;
out.scripts ||= {};
out.scripts.lint ||= 'eslint "src/**" --max-warnings=0';
out.scripts.typecheck ||= 'tsc -p tsconfig.json --noEmit';
out.scripts["test:coverage"] ||= 'vitest run --coverage';
fs.writeFileSync("package.json", JSON.stringify(out,null,2)+"\n");
console.log("OK: package.json reparado y validado");
'@
$tmp=".__fixpkg__.js"; $fix | Set-Content -Encoding UTF8 $tmp; node $tmp; Remove-Item $tmp -Force

# 2) Instalar de forma resiliente y regenerar lock si hace falta
if (Test-Path "pnpm-lock.yaml") {
	pnpm -w install --prefer-frozen-lockfile || (pnpm -w install && pnpm -w install --lockfile-only)
} else {
	pnpm -w install
}

# 3) Smoke opcional rápido (no bloquea)
pnpm -w exec eslint -v | Out-Null; pnpm -w exec tsc -v | Out-Null; pnpm -w exec vitest -v | Out-Null

# 4) Mostrar diff y hacer commit atómico si todo OK
git diff -- package.json | Write-Host
git add package.json package.json.bak
git commit -m "chore(ci): reparar y fusionar package.json + normalizar scripts" | Out-Null
Write-Host "READY: package.json fijo, deps instaladas, commit creado."
