const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'src/application');
const manifest = JSON.parse(fs.readFileSync(path.join(source, 'build-map.json'), 'utf8'));
const check = process.argv.includes('--check');
for (const entry of manifest) {
  const result = Buffer.concat(entry.inputs.map(input => fs.readFileSync(path.join(source, input))));
  const output = path.join(root, 'out', entry.output);
  if (check) {
    if (!fs.existsSync(output) || !result.equals(fs.readFileSync(output))) throw Error('Build differs from committed output: ' + entry.output);
  } else {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, result);
  }
}
console.log(`${check ? 'Byte-for-byte verified' : 'Built'} ${manifest.length} application files from recovered source.`);
