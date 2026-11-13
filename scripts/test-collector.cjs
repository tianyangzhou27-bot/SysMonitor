// Only terminates child processes created by this test, never user applications.
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { spawn, spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const builds = ['resources/processes/SysMonitor-Processes.exe', 'dist/collector/SysMonitor-Processes.exe'];
function invoke(exe, args) {
  const result = spawnSync(exe, args, { encoding: 'utf8', timeout: 10000, windowsHide: true, maxBuffer: 8000000 });
  if (result.error) throw result.error;
  const values = result.stdout.replace(/^\uFEFF/, '').trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
  assert(values.length > 0, 'Expected JSON output');
  return { status: result.status, values };
}
async function test(relative) {
  const exe = path.join(root, relative);
  assert(fs.existsSync(exe), 'Build collector first');
  const invalid = invoke(exe, []);
  assert.equal(invalid.status, 1);
  assert.equal(invalid.values[0].ok, false);
  const child = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { windowsHide: true, stdio: 'ignore' });
  try {
    await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
    const details = invoke(exe, ['--details', String(child.pid)]).values[0];
    assert.equal(details.ok, true);
    assert.equal(details.pid, child.pid);
    assert.match(details.identity, /^\d+$/);
    const stale = invoke(exe, ['--terminate', String(child.pid), '1']);
    assert.equal(stale.values[0].ok, false);
    assert.equal(invoke(exe, ['--details', String(child.pid)]).values[0].ok, true, 'Stale identity must not terminate the child');
    const missing = invoke(exe, ['--terminate', String(child.pid)]);
    assert.equal(missing.values[0].ok, false);
    const samples = invoke(exe, ['--probe', '3']).values;
    assert(samples.length >= 1);
    for (const sample of samples) {
      assert(Number.isFinite(sample.ts));
      assert(Array.isArray(sample.rows));
      assert(['etw', 'unavailable', 'starting'].includes(sample.netSource));
      assert(sample.rows.some(row => row.pid === child.pid));
      assert(sample.rows.every(row => row.cpuPercent == null || Number.isFinite(row.cpuPercent)));
    }
    assert.equal(invoke(exe, ['--terminate', String(child.pid), details.identity]).values[0].ok, true);
    await new Promise(resolve => child.exitCode !== null ? resolve() : child.once('exit', resolve));
    console.log(`PASS ${relative}: JSON protocol, process details, stale-identity rejection, sampling, owned-child termination`);
  } finally { if (child.exitCode === null) child.kill(); }
}
(async () => { for (const exe of builds) await test(exe); })().catch(error => { console.error(error.message); process.exitCode = 1; });
