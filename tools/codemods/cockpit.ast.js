const fs = require('fs');
const recast = require('recast');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node cockpit.ast.js <file.tsx>');
  process.exit(1);
}

let s = fs.readFileSync(file, 'utf8');
let code = s;

// Insertar bloque KPIs si falta marcador
if (!code.includes('ECONEURA_KPIS_BLOCK')) {
  code = code.replace(/(<div className="mt-1[\s\S]*?<\/div>\s*<\/div>\s*<\/div>)/,
`$1
{/* ECONEURA_KPIS_BLOCK */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
 {kpisByDept[dept].map(([label,val])=>(
   <KpiCard key={label} label={label} value={val} theme={theme}/>
 ))}
</div>`);
}

// aria-live en chat
code = code.replace(/<div className="p-2 space-y-2 overflow-auto"([^>]*)>/,
  `<div className="p-2 space-y-2 overflow-auto"$1 aria-live="polite" role="log">`);

// consumo IA por defecto
code = code.replace(/const \[showAllUsage, setShowAllUsage\] = useState\([^)]*\);/,
  `const [showAllUsage,setShowAllUsage]=useState(dept==="ia"); /* ECONEURA_SHOW_USAGE_DEFAULT */`);

// copy fijo
if (!code.includes('Gestiona IA sobre tu stack. No sustituimos ERP/CRM') && code.includes('</footer>')) {
  code = code.replace(/<\/footer>/, ' Gestiona IA sobre tu stack. No sustituimos ERP/CRM.</footer>');
}

fs.writeFileSync(file, code, 'utf8');
console.log('Codemod AST aplicado a', file);
