import * as electron from 'electron/main';
const { app, BrowserWindow } = electron;

console.log('🎉 ELECTRON LOADED! app:', typeof app);

app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 500, height: 400 });
  win.loadURL('data:text/html,<h1>DeskBub!</h1>');
});
