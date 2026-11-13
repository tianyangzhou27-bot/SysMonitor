const { nativeTheme, app } = require('electron');
const os = require('os');
const fs = require('fs');
const path = require('path');

function supportsMaterial(platform, release) {
  const [major, , build] = release.split('.').map(Number);
  return platform === 'win32' && major >= 10 && build >= 22621;
}
function solidColor() { return nativeTheme.shouldUseDarkColors ? '#161c2c' : '#edf2fa'; }
function restore() {
  try {
    const mode = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'appearance.json'), 'utf8')).theme;
    if (['system', 'light', 'dark'].includes(mode)) nativeTheme.themeSource = mode;
  } catch {}
}
function setTheme(mode) {
  if (!['system', 'light', 'dark'].includes(mode)) return;
  nativeTheme.themeSource = mode;
  try {
    const target = path.join(app.getPath('userData'), 'appearance.json');
    fs.writeFileSync(target + '.tmp', JSON.stringify({ theme: mode }));
    fs.renameSync(target + '.tmp', target);
  } catch (error) { console.warn('Theme persistence failed:', error.message); }
}
function attach(win) {
  const capable = supportsMaterial(process.platform, os.release());
  let failed = false;
  function update() {
    if (win.isDestroyed()) return;
    const useMaterial = capable && !failed && !nativeTheme.shouldUseHighContrastColors && !nativeTheme.prefersReducedTransparency;
    // Always paint a readable fallback before attempting the optional native effect.
    win.setBackgroundColor(solidColor());
    if (capable && !failed) {
      try {
        win.setBackgroundMaterial(useMaterial ? 'acrylic' : 'none');
        if (useMaterial) win.setBackgroundColor('#00000000');
      } catch (error) {
        failed = true;
        try { win.setBackgroundMaterial('none'); } catch {}
        win.setBackgroundColor(solidColor());
      }
    }
    if (win.webContents && !win.webContents.isDestroyed()) {
      win.webContents.send('theme:changed', {
        mode: nativeTheme.themeSource,
        resolved: nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
      });
    }
  }
  update();
  nativeTheme.on('updated', update);
  win.once('closed', () => nativeTheme.removeListener('updated', update));
}
module.exports = { supportsMaterial, solidColor, restore, setTheme, attach };
