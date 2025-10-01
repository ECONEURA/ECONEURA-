const { spawnSync } = require('child_process');
const tsc = require.resolve('typescript/bin/tsc');
console.log('tsc resolved to', tsc);
const r = spawnSync(process.execPath, [tsc, '--noEmit', '--pretty', 'false'], { stdio: 'inherit' });
process.exit(r.status || 0);
