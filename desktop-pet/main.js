const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let petWindow = null;
let settingsWindow = null;
let tray = null;

// Config file path (lazy init after app is ready)
let configPath = null;

function getConfigPath() {
  if (!configPath) {
    configPath = path.join(app.getPath('userData'), 'config.json');
  }
  return configPath;
}

function loadConfig() {
  try {
    const p = getConfigPath();
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch (e) { /* ignore */ }
  return {
    sitReminder: 50,
    waterReminder: 90,
    opacity: 0.9,
    petSize: 1.0,
    remindersPaused: false,
  };
}

function saveConfig(config) {
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
}

// Create a simple visible tray icon (16x16 paw-colored square)
function createTrayIcon() {
  // 16x16 PNG with a coral-colored paw-like shape
  const size = 16;
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // Draw a simple paw-like shape: circle at top, bigger circle below
      const cx = size / 2, cy = size / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      // Main pad
      const inPad = dist < 5;
      // Toe dots
      const toes = [
        Math.sqrt((x - cx + 4) ** 2 + (y - cy + 4) ** 2) < 3,
        Math.sqrt((x - cx - 4) ** 2 + (y - cy + 4) ** 2) < 3,
        Math.sqrt((x - cx + 3) ** 2 + (y - cy + 5) ** 2) < 3,
        Math.sqrt((x - cx - 3) ** 2 + (y - cy + 5) ** 2) < 3,
      ];
      if (inPad || toes.some(t => t)) {
        buf[idx] = 0xFF;     // R
        buf[idx + 1] = 0x6B; // G
        buf[idx + 2] = 0x6B; // B
        buf[idx + 3] = 0xFF; // A
      } else {
        buf[idx + 3] = 0x00; // transparent
      }
    }
  }
  return nativeImage.createFromBuffer(buf, { width: size, height: size });
}

function createPetWindow() {
  const config = loadConfig();

  petWindow = new BrowserWindow({
    width: 450,
    height: 500,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    opacity: 0.9,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  petWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Position at center of screen so it's easy to spot
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  petWindow.setPosition(Math.round((width - 350) / 2), Math.round((height - 400) / 2));
  petWindow.setTitle('DeskBub Pet');

  petWindow.on('closed', () => {
    petWindow = null;
  });
}

function createTray() {
  tray = new Tray(createTrayIcon());

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show / Hide Pet',
      click: () => {
        if (petWindow) {
          petWindow.isVisible() ? petWindow.hide() : petWindow.show();
        }
      },
    },
    {
      label: 'Pause Reminders',
      type: 'checkbox',
      checked: loadConfig().remindersPaused,
      click: (menuItem) => {
        const cfg = loadConfig();
        cfg.remindersPaused = menuItem.checked;
        saveConfig(cfg);
        if (petWindow) {
          petWindow.webContents.send('reminders-toggled', !menuItem.checked);
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => createSettingsWindow(),
    },
    { type: 'separator' },
    {
      label: 'Quit DeskBub',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('DeskBub');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (petWindow) {
      petWindow.isVisible() ? petWindow.hide() : petWindow.show();
    }
  });
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 420,
    height: 480,
    resizable: false,
    title: 'DeskBub Settings',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  settingsWindow.loadFile(path.join(__dirname, 'renderer', 'settings.html'));
  settingsWindow.setMenuBarVisibility(false);

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// IPC handlers
ipcMain.handle('get-config', () => loadConfig());

ipcMain.handle('save-config', (_, config) => {
  saveConfig(config);
  if (petWindow) {
    petWindow.setOpacity(config.opacity);
    petWindow.webContents.send('config-updated', config);
  }
  return true;
});

ipcMain.handle('set-ignore-mouse', (_, ignore, options) => {
  if (petWindow) {
    petWindow.setIgnoreMouseEvents(ignore, options);
  }
});

// App lifecycle
app.whenReady().then(() => {
  createPetWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // Don't quit — tray keeps running
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('activate', () => {
  if (!petWindow) createPetWindow();
});
