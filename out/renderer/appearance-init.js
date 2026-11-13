// Resolve before styles and React mount to avoid a dark flash on light startup.
(() => {
  let mode = 'system';
  try { mode = localStorage.getItem('sysmonitor.theme') || 'system'; } catch {}
  const dark = mode === 'dark' || (mode !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
})();
