const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
let outside = 0, telegram = 0;
const context = vm.createContext({
  net: { connect() { outside++; throw Error('External connection attempted'); } },
  performance: { now: () => 0 },
  runCapture: async () => ({ out: Buffer.from('time=1ms'), code: 0 }),
  decodeConsole: b => b.toString(),
  lookupPublicIps: async () => { outside++; return { domestic: 'test' }; },
  setInterval: () => 1, clearInterval: () => {}, Buffer, Promise, Date,
  require(name) {
    if (name === 'electron') return { session: {} };
    if (name === './telegram-report') return { EnergyMeter: class {}, report: () => '' };
    if (name === './process-metrics') return { topText: () => '', alertLeaders: () => '' };
    return require(name);
  }, module: { exports: {} }, AbortSignal
});
const root = 'src/application/';
vm.runInContext(fs.readFileSync(root + 'main/modules/main/collectors/network.js', 'utf8'), context);
vm.runInContext(fs.readFileSync(root + 'main/modules/main/collectors/quality.js', 'utf8'), context);
const NetworkCollector = vm.runInContext('NetworkCollector', context);
const QualityCollector = vm.runInContext('QualityCollector', context);
(async () => {
  const network = new NetworkCollector();
  network.setPolicy({ localOnly: true, publicIp: true, internetProbe: true });
  network.stopped = false;
  network.adapters = [{ gateway: '192.168.1.1', ip4: '192.168.1.2', virtual: false }];
  await network.probe();
  await network.refreshPublicIp();
  const quality = new QualityCollector(() => '192.168.1.1');
  quality.setPolicy({ localOnly: true, internetProbe: true });
  await quality.tick();
  assert.equal(outside, 0);
  vm.runInContext(fs.readFileSync(root + 'files/main/telegram.js', 'utf8'), context);
  context.module.exports.setOffline(true);
  await assert.rejects(vm.runInContext('api("getUpdates", {})', context), /仅本地模式/);
  assert.equal(telegram, 0);
  console.log('PASS local-only mode blocks public IP, Internet probes and Telegram requests');
})().catch(e => { console.error(e); process.exitCode = 1; });
