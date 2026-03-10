const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let nextProcess = null;
let nestProcess = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
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
  // Start backend NestJS process
  console.log('Starting NestJS Backend Server...');
  if (app.isPackaged) {
    // In production, run the compiled backend directly using the Electron binary as a pure Node.js runtime
    nestProcess = spawn(process.execPath, [path.join(__dirname, '../backend/dist/main.js')], {
      cwd: path.join(__dirname, '../backend'),
      stdio: 'inherit',
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        DESKTOP_ENV: 'true',
        IS_ELECTRON: 'true'
      }
    });
  } else {
    // In development, use npm script
    nestProcess = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'start'], {
      cwd: path.join(__dirname, '../backend'),
      stdio: 'inherit'
    });
  }

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
  if (nestProcess) {
    nestProcess.kill();
  }
});
