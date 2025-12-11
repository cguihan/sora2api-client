const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Allow local file access for development if needed, but ContextBridge is better
    },
    // Reverting to hidden title bar to restore Windows animations and rounded corners
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000', // Transparent attempt for buttons
      symbolColor: '#4b5563', // Gray-600 for symbols
      height: 30
    },
    title: "Sora Client",
    backgroundColor: '#f8f9fa', // Light background to match theme (glass effect renders on top)
    show: false // Don't show until ready
  });

  // Remove default menu
  mainWindow.setMenu(null);

  // Load URL
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// --- IPC Handlers ---

// Open external URL or file
ipcMain.handle('shell:open', async (event, url) => {
  await shell.openPath(url);
});

// Select directory
ipcMain.handle('dialog:select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// Download Video
ipcMain.handle('video:download', async (event, { url, savePath, filename }) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(savePath)) {
      try {
        fs.mkdirSync(savePath, { recursive: true });
      } catch (e) {
        reject(`Failed to create directory: ${e.message}`);
        return;
      }
    }

    const fullPath = path.join(savePath, filename);
    const file = fs.createWriteStream(fullPath);

    // Determines protocol
    const adapter = url.startsWith('https') ? https : http;

    const request = adapter.get(url, function (response) {
      if (response.statusCode !== 200) {
        reject(`Failed to download: Status Code ${response.statusCode}`);
        return;
      }
      response.pipe(file);
      file.on('finish', function () {
        file.close(() => resolve(fullPath));
      });
    }).on('error', function (err) {
      fs.unlink(fullPath, () => { }); // Delete the file async. (But we don't check for this in this simple example)
      reject(err.message);
    });
  });
});

// Window Controls
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window:close', () => mainWindow?.close());

// Update Title Bar Overlay (Deprecated with frame: false, but keeping for compatibility if needed)
ipcMain.handle('window:update-title-bar', (event, config) => {
  // No-op for custom frame
});

// --- Local File Storage Support (Unlimited Quota) ---
const STORAGE_DIR = path.join(app.getPath('userData'), 'storage');
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

ipcMain.handle('db:save', async (event, key, data) => {
  try {
    const filePath = path.join(STORAGE_DIR, `${key}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(data));
    return { success: true };
  } catch (e) {
    console.error(`DB Save Error (${key}):`, e);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('db:load', async (event, key) => {
  try {
    const filePath = path.join(STORAGE_DIR, `${key}.json`);
    if (!fs.existsSync(filePath)) return null;
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error(`DB Load Error (${key}):`, e);
    return null;
  }
});
