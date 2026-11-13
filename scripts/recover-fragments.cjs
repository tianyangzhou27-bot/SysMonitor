const fs = require('fs');
const path = require('path');
const index = [];
for (const [bundle, file] of Object.entries({ main: 'out/main/index.js', preload: 'out/preload/index.js', renderer: 'out/renderer/assets/index-CzIv0K4n.js' })) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^\s*\/\/#region (src\/.*)$/);
    if (!match) continue;
    let end = i + 1, depth = 1;
    while (end < lines.length) {
      if (/^\s*\/\/#region\b/.test(lines[end])) depth++;
      if (/^\s*\/\/#endregion\b/.test(lines[end]) && --depth === 0) break;
      end++;
    }
    const target = `recovered-src/${bundle}/${match[1].replace(/\.(tsx?|jsx?)$/, '.generated.js')}`;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `// GENERATED FRAGMENT — extracted from ${file}, lines ${i + 2}-${end}.\n// Original module marker: ${match[1]}. Not original TypeScript/TSX; not standalone.\n` + lines.slice(i + 1, end).join('\n') + '\n');
    index.push({ bundle, originalMarker: match[1], file: target, bundleLines: `${i + 2}-${end}` });
  }
}
fs.writeFileSync('recovered-src/INDEX.json', JSON.stringify(index, null, 2) + '\n');
console.log(`Recovered ${index.length} fragments`);
