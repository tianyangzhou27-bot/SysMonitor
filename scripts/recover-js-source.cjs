// One-time import of the supplied JavaScript build into an editable source tree.
// Normal builds use build-js.cjs; do not rerun this over edited source files.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'src/application');
if (fs.existsSync(path.join(source, 'build-map.json'))) throw Error('Recovered source already exists; refusing to overwrite it.');
const manifest = [];
const bundles = new Set(['main/index.js', 'preload/index.js', 'renderer/assets/index-CzIv0K4n.js']);
function write(name, data) {
  const target = path.join(source, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data);
  return name;
}
function walk(dir, prefix = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(file, relative + '/'); continue; }
    const data = fs.readFileSync(file);
    if (!bundles.has(relative)) {
      manifest.push({ output: relative, inputs: [write('files/' + relative, data)] });
      continue;
    }
    const area = relative.split('/')[0];
    const lines = data.toString('utf8').match(/[^\n]*\n|[^\n]+$/g) || [];
    const inputs = [];
    let cursor = 0, sequence = 0;
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^\s*\/\/#region (.+?)\r?\n?$/);
      if (!match) continue;
      if (i > cursor) inputs.push(write(`${area}/scaffold/${sequence++}.js`, lines.slice(cursor, i).join('')));
      let end = i + 1, depth = 1;
      while (end < lines.length) {
        if (/^\s*\/\/#region\b/.test(lines[end])) depth++;
        if (/^\s*\/\/#endregion\b/.test(lines[end]) && --depth === 0) break;
        end++;
      }
      if (end >= lines.length) throw Error('Unclosed region in ' + relative);
      const marker = match[1];
      const name = marker.startsWith('src/')
        ? `${area}/modules/${marker.slice(4).replace(/\.(tsx?|jsx?)$/, '.js')}`
        : `${area}/vendor/${String(sequence++).padStart(3, '0')}.js`;
      inputs.push(write(name, lines.slice(i, end + 1).join('')));
      cursor = end + 1;
      i = end;
    }
    if (cursor < lines.length) inputs.push(write(`${area}/scaffold/${sequence++}.js`, lines.slice(cursor).join('')));
    manifest.push({ output: relative, inputs });
  }
}
walk(path.join(root, 'out'));
write('build-map.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`Recovered ${manifest.length} outputs into ${manifest.reduce((n, x) => n + x.inputs.length, 0)} editable source files.`);
