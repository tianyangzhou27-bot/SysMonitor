const valid = n => typeof n === 'number' && Number.isFinite(n);
function cpuSensors(sensors, type) {
  return sensors.filter(s => s.type === type && /^\/(intelcpu|amdcpu)\/\d+\//.test(s.id) && valid(s.value));
}
function cpuTemperature(sensors) {
  const temps = cpuSensors(sensors, 'Temperature').filter(s => s.value > 0 && s.value < 150);
  const packageSensor = temps.find(s => s.name === 'CPU Package') || temps.find(s => /^Core \((Tctl|Tdie)/.test(s.name));
  if (packageSensor) return packageSensor.value;
  const cores = temps.filter(s => /Core|核心/i.test(s.name));
  return cores.length ? Math.max(...cores.map(s => s.value)) : null;
}
function cpuPower(raplMilliwatts, sensors, online) {
  if (valid(raplMilliwatts) && raplMilliwatts >= 0) return raplMilliwatts / 1000;
  if (!online) return null;
  const packages = cpuSensors(sensors, 'Power').filter(s => s.value >= 0 && /^(CPU Package|Package)$/i.test(s.name));
  // A package includes its cores: never add core power to the package a second time.
  return packages.length ? packages.reduce((sum, s) => sum + s.value, 0) : null;
}
module.exports = { cpuTemperature, cpuPower };
