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
    sitReminder: 50,    // minutes
    waterReminder: 90,  // minutes
    opacity: 0.9,
    petSize: 1.0,
    remindersPaused: false,
  };
}

function saveConfig(config) {
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
}

function createPetWindow() {
  const config = loadConfig();

  petWindow = new BrowserWindow({
    width: 350,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    opacity: config.opacity,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // Position at bottom-right of screen
    x: undefined,
    y: undefined,
  });

  petWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Make window click-through except for the pet body area
  petWindow.setIgnoreMouseEvents(false);

  // Position at bottom right initially
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  petWindow.setPosition(width - 380, height - 450);

  // Save position on move
  petWindow.on('moved', () => {
    const [x, y] = petWindow.getPosition();
    // store position? not needed for now
  });

  petWindow.on('closed', () => {
    petWindow = null;
  });
}

function createTray() {
  // Create a simple 16x16 tray icon
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  if (fs.existsSync(iconPath)) {
    tray = new Tray(iconPath);
  } else {
    // Fallback: create a tiny transparent image
    const img = nativeImage.createEmpty();
    tray = new Tray(img);
  }

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
  // Don't quit on window close — tray keeps running
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('activate', () => {
  if (!petWindow) createPetWindow();
});
