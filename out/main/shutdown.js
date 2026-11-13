// Release hardware control before stopping collectors. Cleanup and quit are idempotent.
module.exports = function installShutdown(app, begin, release, cleanup) {
  let started = false, ready = false;
  app.on('before-quit', event => {
    if (ready) return;
    event.preventDefault();
    if (started) return;
    started = true;
    begin();
    let timer;
    Promise.race([
      Promise.resolve().then(release),
      new Promise(resolve => { timer = setTimeout(resolve, 2500); })
    ]).catch(() => {}).finally(() => {
      clearTimeout(timer);
      for (const step of cleanup) { try { step(); } catch {} }
      ready = true;
      // Avoid leaving an inert singleton behind if a native window blocks shutdown.
      const fallback = setTimeout(() => app.exit(0), 2000);
      fallback.unref?.();
      app.quit();
    });
  });
};
