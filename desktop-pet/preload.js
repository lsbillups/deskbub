const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('deskBub', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  setIgnoreMouse: (ignore, options) => ipcRenderer.invoke('set-ignore-mouse', ignore, options),
  setActions: (actions) => ipcRenderer.invoke('set-actions', actions),
  onConfigUpdated: (callback) => ipcRenderer.on('config-updated', (_, config) => callback(config)),
  onRemindersToggled: (callback) => ipcRenderer.on('reminders-toggled', (_, enabled) => callback(enabled)),
  onTrayAction: (callback) => ipcRenderer.on('tray-action', (_, action) => callback(action)),
});
