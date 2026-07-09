const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let petWindow = null;
let settingsWindow = null;
let tray = null;
let currentActions = []; // {url, label} from renderer

let configPath = null;

function getConfigPath() {
  if (!configPath) configPath = path.join(app.getPath('userData'), 'config.json');
  return configPath;
}

function loadConfig() {
  try {
    const p = getConfigPath();
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch (e) {}
  return { sitReminder: 50, waterReminder: 90, opacity: 0.9, petSize: 1.0, remindersPaused: false };
}

function saveConfig(config) {
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
}

function createTrayIcon() {
  const size = 16;
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const cx = size / 2, cy = size / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const inPad = dist < 5;
      const toes = [
        Math.sqrt((x - cx + 4) ** 2 + (y - cy + 4) ** 2) < 3,
        Math.sqrt((x - cx - 4) ** 2 + (y - cy + 4) ** 2) < 3,
        Math.sqrt((x - cx + 3) ** 2 + (y - cy + 5) ** 2) < 3,
        Math.sqrt((x - cx - 3) ** 2 + (y - cy + 5) ** 2) < 3,
      ];
      if (inPad || toes.some(t => t)) {
        buf[idx] = 0xFF; buf[idx + 1] = 0x6B; buf[idx + 2] = 0x6B; buf[idx + 3] = 0xFF;
      } else {
        buf[idx + 3] = 0x00;
      }
    }
  }
  return nativeImage.createFromBuffer(buf, { width: size, height: size });
}

function buildTrayMenu() {
  const template = [];

  // Action items from renderer
  if (currentActions.length > 0) {
    currentActions.forEach((a, i) => {
      template.push({
        label: `${i + 1}. ${a.label || 'Action ' + (i + 1)}`,
        click: () => {
          if (petWindow) petWindow.webContents.send('tray-action', String(i));
        },
      });
    });
    template.push({ type: 'separator' });
    template.push({
      label: '▶ Next Action',
      click: () => { if (petWindow) petWindow.webContents.send('tray-action', 'next'); },
    });
    template.push({ type: 'separator' });
  }

  template.push({
    label: 'Show / Hide Pet',
    click: () => { if (petWindow) petWindow.isVisible() ? petWindow.hide() : petWindow.show(); },
  });
  template.push({
    label: 'Pause Reminders',
    type: 'checkbox',
    checked: loadConfig().remindersPaused,
    click: (menuItem) => {
      const cfg = loadConfig();
      cfg.remindersPaused = menuItem.checked;
      saveConfig(cfg);
      if (petWindow) petWindow.webContents.send('reminders-toggled', !menuItem.checked);
    },
  });
  template.push({ type: 'separator' });
  template.push({ label: 'Settings', click: () => createSettingsWindow() });
  template.push({ type: 'separator' });
  template.push({ label: 'Quit DeskBub', click: () => { app.isQuitting = true; app.quit(); } });

  return Menu.buildFromTemplate(template);
}

function createPetWindow() {
  const config = loadConfig();
  petWindow = new BrowserWindow({
    width: 240, height: 280,
    transparent: true, frame: false, alwaysOnTop: true,
    hasShadow: false, resizable: false, skipTaskbar: true,
    opacity: config.opacity,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  });
  petWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  const { screen } = require('electron');
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  petWindow.setPosition(Math.round((width - 260) / 2), Math.round((height - 300) / 2));
  petWindow.on('closed', () => { petWindow = null; });
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip('DeskBub');
  tray.setContextMenu(buildTrayMenu());
  tray.on('click', () => {
    if (petWindow) petWindow.isVisible() ? petWindow.hide() : petWindow.show();
  });
}

function createSettingsWindow() {
  if (settingsWindow) { settingsWindow.focus(); return; }
  settingsWindow = new BrowserWindow({
    width: 420, height: 480, resizable: false, title: 'DeskBub Settings',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  settingsWindow.loadFile(path.join(__dirname, 'renderer', 'settings.html'));
  settingsWindow.setMenuBarVisibility(false);
  settingsWindow.on('closed', () => { settingsWindow = null; });
}

// IPC: renderer sends action list
ipcMain.handle('set-actions', (_, actions) => {
  currentActions = actions || [];
  if (tray) tray.setContextMenu(buildTrayMenu());
});

ipcMain.handle('get-config', () => loadConfig());
ipcMain.handle('save-config', (_, config) => {
  saveConfig(config);
  if (petWindow) { petWindow.setOpacity(config.opacity); petWindow.webContents.send('config-updated', config); }
  return true;
});
ipcMain.handle('set-ignore-mouse', (_, ignore, options) => {
  if (petWindow) petWindow.setIgnoreMouseEvents(ignore, options);
});

app.whenReady().then(() => { createPetWindow(); createTray(); });
app.on('window-all-closed', () => {});
app.on('before-quit', () => { app.isQuitting = true; });
app.on('activate', () => { if (!petWindow) createPetWindow(); });
