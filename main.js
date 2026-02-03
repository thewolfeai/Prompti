const { app, BrowserWindow, Tray, globalShortcut, ipcMain, clipboard, nativeImage, screen } = require('electron');
const path = require('path');

let tray = null;
let mainWindow = null;

// Create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    show: false,
    frame: false,
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  // Hide window when it loses focus
  mainWindow.on('blur', () => {
    if (mainWindow && !mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide();
    }
  });

  // Prevent window from being closed, just hide it
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

// Create tray icon
function createTray() {
  // Create a simple colored icon (will be replaced with proper icon later)
  const iconSize = 16;
  const icon = nativeImage.createEmpty();

  // For now, use a template image approach - create a simple icon
  // In production, replace with actual icon file
  tray = new Tray(createTrayIcon());

  tray.setToolTip('Prompti - Click to enhance prompts');

  tray.on('click', (event, bounds) => {
    toggleWindow(bounds);
  });
}

// Create a simple tray icon programmatically
function createTrayIcon() {
  // Create a 16x16 icon with a simple "P" or spark design
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4);

  // Fill with transparent
  for (let i = 0; i < canvas.length; i += 4) {
    canvas[i] = 0;     // R
    canvas[i + 1] = 0; // G
    canvas[i + 2] = 0; // B
    canvas[i + 3] = 0; // A
  }

  // Draw a simple spark/star pattern
  const setPixel = (x, y, r, g, b, a) => {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      const idx = (y * size + x) * 4;
      canvas[idx] = r;
      canvas[idx + 1] = g;
      canvas[idx + 2] = b;
      canvas[idx + 3] = a;
    }
  };

  // Simple spark pattern (white on dark menubar)
  const color = [255, 255, 255, 255];
  // Vertical line
  for (let y = 2; y < 14; y++) {
    setPixel(8, y, ...color);
  }
  // Horizontal line
  for (let x = 2; x < 14; x++) {
    setPixel(x, 8, ...color);
  }
  // Diagonal lines
  for (let i = 0; i < 5; i++) {
    setPixel(4 + i, 4 + i, ...color);
    setPixel(11 - i, 4 + i, ...color);
    setPixel(4 + i, 11 - i, ...color);
    setPixel(11 - i, 11 - i, ...color);
  }

  const icon = nativeImage.createFromBuffer(canvas, { width: size, height: size });
  icon.setTemplateImage(true);
  return icon;
}

// Toggle window visibility
function toggleWindow(trayBounds) {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    showWindow(trayBounds);
  }
}

// Show window positioned below tray icon
function showWindow(trayBounds) {
  if (!trayBounds && tray) {
    trayBounds = tray.getBounds();
  }

  const windowBounds = mainWindow.getBounds();

  // Position window below tray icon, centered
  let x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
  let y = Math.round(trayBounds.y + trayBounds.height + 4);

  // Make sure window stays on screen
  const display = screen.getDisplayNearestPoint({ x, y });

  if (x + windowBounds.width > display.bounds.x + display.bounds.width) {
    x = display.bounds.x + display.bounds.width - windowBounds.width - 10;
  }
  if (x < display.bounds.x) {
    x = display.bounds.x + 10;
  }

  mainWindow.setPosition(x, y, false);
  mainWindow.show();
  mainWindow.focus();

  // Send clipboard content to renderer
  const clipboardText = clipboard.readText();
  if (clipboardText && clipboardText.length < 5000) {
    mainWindow.webContents.send('clipboard-content', clipboardText);
  }
}

// Register global shortcut
function registerShortcuts() {
  const shortcut = process.platform === 'darwin' ? 'CommandOrControl+Shift+Space' : 'Ctrl+Shift+Space';

  const registered = globalShortcut.register(shortcut, () => {
    if (tray) {
      toggleWindow(tray.getBounds());
    }
  });

  if (!registered) {
    console.error('Failed to register global shortcut');
  }
}

// App ready
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerShortcuts();

  // Hide dock icon on macOS (menubar apps don't need dock icon)
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
});

// Cleanup on quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

// IPC Handlers
ipcMain.handle('get-clipboard', () => {
  return clipboard.readText();
});

ipcMain.handle('set-clipboard', (event, text) => {
  clipboard.writeText(text);
  return true;
});

ipcMain.handle('hide-window', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

// Storage IPC handlers (will be implemented in storage.js)
ipcMain.handle('storage-get', async (event, key) => {
  const storage = require('./storage');
  return await storage.get(key);
});

ipcMain.handle('storage-set', async (event, key, value) => {
  const storage = require('./storage');
  return await storage.set(key, value);
});

ipcMain.handle('storage-delete', async (event, key) => {
  const storage = require('./storage');
  return await storage.delete(key);
});

// Provider IPC handlers (will be implemented in providers.js)
ipcMain.handle('enhance-prompt', async (event, { prompt, provider, model, apiKey }) => {
  const providers = require('./providers');
  return await providers.enhance(prompt, provider, model, apiKey);
});

ipcMain.handle('validate-api-key', async (event, { provider, apiKey }) => {
  const providers = require('./providers');
  return await providers.validateKey(provider, apiKey);
});

ipcMain.handle('get-ollama-models', async () => {
  const providers = require('./providers');
  return await providers.getOllamaModels();
});
