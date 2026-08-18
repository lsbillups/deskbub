const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, clipboard, dialog, shell, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');
const { fileURLToPath } = require('url');
const { normalizeConfig, mergeConfig } = require('./pet-config');
const { loadStarterPet } = require('./starter-library');

const BASE_PET_WIDTH = 170;
const BASE_PET_HEIGHT = 210;
const MAX_SHARE_FILE_BYTES = 200 * 1024 * 1024;
const SHARE_CAPTION = 'My pet lives on my desktop now 🐾\nMake yours at https://deskbub.com';

let petWindow = null;
let settingsWindow = null;
let tray = null;
let currentActions = []; // {url, label} from renderer
let currentAction = null;
let lastSharedFile = null;

let configPath = null;

function getConfigPath() {
  if (!configPath) configPath = path.join(app.getPath('userData'), 'config.json');
  return configPath;
}

function loadConfig() {
  try {
    const p = getConfigPath();
    if (fs.existsSync(p)) return normalizeConfig(JSON.parse(fs.readFileSync(p, 'utf-8')));
  } catch (e) {}
  return normalizeConfig({});
}

function saveConfig(config) {
  const normalized = normalizeConfig(config);
  fs.mkdirSync(path.dirname(getConfigPath()), { recursive: true });
  fs.writeFileSync(getConfigPath(), JSON.stringify(normalized, null, 2));
  return normalized;
}

function patchConfig(patch) {
  return saveConfig(mergeConfig(loadConfig(), patch));
}

function getStarterRoot() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'starter-pets')
    : path.join(__dirname, 'starter-pets');
}

function getStarterPet(starterId = 'kaka') {
  return loadStarterPet(getStarterRoot(), starterId);
}

function applyConfigToPetWindow(config, animate = false) {
  if (!petWindow || petWindow.isDestroyed()) return;
  const normalized = normalizeConfig(config);
  const width = Math.round(BASE_PET_WIDTH * normalized.petSize);
  const height = Math.round(BASE_PET_HEIGHT * normalized.petSize);
  const bounds = petWindow.getBounds();
  const nextBounds = {
    x: Math.round(bounds.x + (bounds.width - width) / 2),
    y: Math.round(bounds.y + (bounds.height - height) / 2),
    width,
    height,
  };
  petWindow.setBounds(nextBounds, animate);
  petWindow.setOpacity(normalized.opacity);
  petWindow.webContents.send('config-updated', normalized);
}

function notifyControlPanel(channel, payload) {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    if (settingsWindow.webContents.isLoadingMainFrame()) {
      settingsWindow.webContents.once('did-finish-load', () => {
        if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.webContents.send(channel, payload);
      });
    } else {
      settingsWindow.webContents.send(channel, payload);
    }
  }
}

function setPetVisibility(visible) {
  const nextVisible = Boolean(visible);
  patchConfig({ petVisible: nextVisible });
  if (petWindow && !petWindow.isDestroyed()) {
    if (nextVisible) petWindow.show();
    else petWindow.hide();
  }
  notifyControlPanel('pet-visibility-updated', nextVisible);
  if (tray) tray.setContextMenu(buildTrayMenu());
  return nextVisible;
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
    label: 'Use Free Kaka',
    click: () => { if (petWindow) petWindow.webContents.send('use-starter-pet', 'kaka'); },
  });
  template.push({
    label: 'Pair My Pet…',
    click: () => {
      createSettingsWindow();
      notifyControlPanel('focus-pairing');
    },
  });
  template.push({
    label: 'Share My Pet…',
    click: () => { void shareCurrentPet(); },
  });
  template.push({ type: 'separator' });

  const petIsVisible = petWindow && !petWindow.isDestroyed()
    ? petWindow.isVisible()
    : loadConfig().petVisible;
  template.push({
    label: petIsVisible ? 'Hide Pet' : 'Show Pet',
    click: () => setPetVisibility(!petIsVisible),
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
      notifyControlPanel('reminders-toggled', !menuItem.checked);
    },
  });
  template.push({ type: 'separator' });
  template.push({ label: 'Settings', click: () => createSettingsWindow() });
  template.push({ type: 'separator' });
  template.push({ label: 'Quit DeskBub', click: () => { app.isQuitting = true; app.quit(); } });

  return Menu.buildFromTemplate(template);
}

function safeFileSegment(value, fallback) {
  const sanitized = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return sanitized || fallback;
}

function localStarterPathFromUrl(url) {
  const candidate = fileURLToPath(url);
  const root = path.resolve(getStarterRoot());
  const resolved = path.resolve(candidate);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error('Only bundled pet files can be exported from local storage.');
  }
  return resolved;
}

async function writeActionToFile(action, destination) {
  const parsed = new URL(action.url);
  if (parsed.protocol === 'file:') {
    await fs.promises.copyFile(localStarterPathFromUrl(action.url), destination);
    return;
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('This pet action cannot be exported safely.');
  }

  const response = await fetch(action.url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Could not download pet action (${response.status}).`);
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_SHARE_FILE_BYTES) {
    throw new Error('This pet animation is too large to export.');
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_SHARE_FILE_BYTES) throw new Error('This pet animation is too large to export.');
  await fs.promises.writeFile(destination, bytes);
}

async function shareCurrentPet() {
  if (!currentAction || !currentAction.url) {
    createSettingsWindow();
    notifyControlPanel('share-result', { error: 'Play an action before sharing it.' });
    return { error: 'No active pet action.' };
  }

  const petName = loadConfig().pet.mode === 'starter' ? 'kaka' : 'my-pet';
  const actionName = safeFileSegment(currentAction.label, 'action');
  const defaultPath = path.join(app.getPath('downloads'), `deskbub-${petName}-${actionName}.webm`);
  const result = await dialog.showSaveDialog(settingsWindow || petWindow, {
    title: 'Save a pet animation to share',
    defaultPath,
    buttonLabel: 'Save animation',
    filters: [{ name: 'WebM animation', extensions: ['webm'] }],
  });
  if (result.canceled || !result.filePath) return { canceled: true };

  try {
    await writeActionToFile(currentAction, result.filePath);
    clipboard.writeText(SHARE_CAPTION);
    lastSharedFile = result.filePath;
    const payload = { filePath: result.filePath, caption: SHARE_CAPTION, format: 'webm' };
    createSettingsWindow();
    notifyControlPanel('share-result', payload);
    return payload;
  } catch (error) {
    const payload = { error: error instanceof Error ? error.message : 'Could not save this animation.' };
    createSettingsWindow();
    notifyControlPanel('share-result', payload);
    return payload;
  }
}

async function saveScreenRecording(bytes) {
  const buffer = Buffer.from(bytes);
  if (buffer.length === 0 || buffer.length > MAX_SHARE_FILE_BYTES) {
    return { error: 'The screen recording is empty or too large to save.' };
  }
  const defaultPath = path.join(app.getPath('downloads'), `deskbub-desktop-${Date.now()}.webm`);
  const result = await dialog.showSaveDialog(settingsWindow || petWindow, {
    title: 'Save your DeskBub desktop clip',
    defaultPath,
    buttonLabel: 'Save desktop clip',
    filters: [{ name: 'WebM video', extensions: ['webm'] }],
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  try {
    await fs.promises.writeFile(result.filePath, buffer);
    clipboard.writeText(SHARE_CAPTION);
    lastSharedFile = result.filePath;
    const payload = { filePath: result.filePath, caption: SHARE_CAPTION, format: 'webm', kind: 'desktop-recording' };
    notifyControlPanel('share-result', payload);
    return payload;
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not save the desktop clip.' };
  }
}

function createPetWindow() {
  const config = loadConfig();
  const initialWidth = Math.round(BASE_PET_WIDTH * config.petSize);
  const initialHeight = Math.round(BASE_PET_HEIGHT * config.petSize);
  petWindow = new BrowserWindow({
    width: initialWidth, height: initialHeight,
    transparent: true, frame: false, alwaysOnTop: true,
    hasShadow: false, resizable: false, skipTaskbar: true,
    show: config.petVisible,
    opacity: config.opacity,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  });
  petWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  const { screen } = require('electron');
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  petWindow.setPosition(Math.round((width - initialWidth) / 2), Math.round((height - initialHeight) / 2));
  petWindow.on('closed', () => { petWindow = null; });
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip('DeskBub');
  tray.setContextMenu(buildTrayMenu());
  tray.on('click', () => {
    if (petWindow) setPetVisibility(!petWindow.isVisible());
  });
}

function createSettingsWindow() {
  if (settingsWindow) { settingsWindow.show(); settingsWindow.focus(); return; }
  settingsWindow = new BrowserWindow({
    width: 480, height: 680, minWidth: 440, minHeight: 560, resizable: true, title: 'DeskBub Controls',
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
  notifyControlPanel('actions-updated', currentActions);
});

ipcMain.handle('set-current-action', (_, action) => {
  currentAction = action && action.url ? action : null;
  notifyControlPanel('current-action-updated', currentAction);
  return true;
});

ipcMain.handle('get-config', () => loadConfig());
ipcMain.handle('save-config', (_, patch) => {
  const config = patchConfig(patch);
  applyConfigToPetWindow(config, true);
  if (petWindow) petWindow.webContents.send('reminders-toggled', !config.remindersPaused);
  if (tray) tray.setContextMenu(buildTrayMenu());
  return config;
});
ipcMain.handle('get-starter-pet', (_, starterId) => getStarterPet(starterId));
ipcMain.handle('save-pet-selection', (_, pet) => patchConfig({ pet }).pet);
ipcMain.handle('get-actions', () => ({ actions: currentActions, currentAction }));
ipcMain.handle('open-control-panel', () => { createSettingsWindow(); return true; });
ipcMain.handle('get-pet-visibility', () => Boolean(petWindow && !petWindow.isDestroyed() && petWindow.isVisible()));
ipcMain.handle('set-pet-visible', (_, visible) => setPetVisibility(visible));
ipcMain.handle('control-action', (_, action) => {
  if (petWindow) petWindow.webContents.send('tray-action', String(action));
  return true;
});
ipcMain.handle('pair-pet', (_, code) => {
  if (!/^\d{6}$/.test(String(code || ''))) return false;
  if (petWindow) petWindow.webContents.send('pair-pet', String(code));
  return true;
});
ipcMain.handle('use-starter-pet', (_, starterId) => {
  if (petWindow) petWindow.webContents.send('use-starter-pet', String(starterId || 'kaka'));
  return true;
});
ipcMain.handle('report-pairing-result', (_, result) => {
  notifyControlPanel('pairing-result', result);
  return true;
});
ipcMain.handle('test-reminder', (_, type) => {
  if (!petWindow || petWindow.isDestroyed()) return false;
  setPetVisibility(true);
  petWindow.webContents.send('test-reminder', type === 'stretch' ? 'stretch' : 'water');
  return true;
});
ipcMain.handle('read-clipboard', () => clipboard.readText());
ipcMain.handle('copy-share-caption', () => { clipboard.writeText(SHARE_CAPTION); return SHARE_CAPTION; });
ipcMain.handle('share-my-pet', () => shareCurrentPet());
ipcMain.handle('get-capture-sources', async () => {
  const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } });
  return sources.map((source) => ({ id: source.id, name: source.name, displayId: source.display_id }));
});
ipcMain.handle('set-control-panel-visible', (_, visible) => {
  if (!settingsWindow || settingsWindow.isDestroyed()) return false;
  if (visible) { settingsWindow.show(); settingsWindow.focus(); }
  else settingsWindow.hide();
  return true;
});
ipcMain.handle('save-screen-recording', (_, bytes) => saveScreenRecording(bytes));
ipcMain.handle('show-shared-file', () => {
  if (lastSharedFile) shell.showItemInFolder(lastSharedFile);
  return Boolean(lastSharedFile);
});
ipcMain.handle('open-share-platform', (_, platform) => {
  const destinations = {
    tiktok: 'https://www.tiktok.com/upload',
    x: 'https://x.com/compose/post',
    instagram: 'https://www.instagram.com/',
  };
  const target = destinations[platform];
  if (!target) return false;
  void shell.openExternal(target);
  return true;
});
ipcMain.handle('set-ignore-mouse', (_, ignore, options) => {
  if (petWindow) petWindow.setIgnoreMouseEvents(ignore, options);
});

app.whenReady().then(() => {
  const config = loadConfig();
  createPetWindow();
  createTray();
  if (!config.welcomeSeen) {
    createSettingsWindow();
    patchConfig({ welcomeSeen: true });
  }
});
app.on('window-all-closed', () => {});
app.on('before-quit', () => { app.isQuitting = true; });
app.on('activate', () => { if (!petWindow) createPetWindow(); });
