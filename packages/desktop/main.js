const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let nextProcess = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // If in production, load the static Next.js export
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../frontend/out/index.html'));
  } else {
    // In dev, load localhost where Next.js is running
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  // Try to start Next.js process if not packaged
  if (!app.isPackaged) {
    console.log('Starting Next.js Dev Server...');
    nextProcess = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '../frontend'),
      stdio: 'inherit'
    });
  }

  // Wait a moment for Next.js to boot up before showing window
  setTimeout(createWindow, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (nextProcess) {
    nextProcess.kill();
  }
});
