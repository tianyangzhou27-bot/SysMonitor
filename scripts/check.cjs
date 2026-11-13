const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
const files = [...walk('out'), ...walk('scripts')].filter(f => /\.(?:js|cjs)$/.test(f));
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(1);
}
console.log(`Syntax OK: ${files.length} JavaScript files`);
