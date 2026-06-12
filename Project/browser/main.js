const { app, BrowserWindow, globalShortcut, ipcMain, session } = require('electron');
const path = require('path');
const axios = require('axios');

let mainWindow;
let isExamActive = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // needed to use ipcRenderer in ui.js
      webviewTag: true
    }
  });

  mainWindow.loadFile('index.html');

  // Detect blur for cheating when exam is active
  mainWindow.on('blur', async () => {
    if (isExamActive) {
      console.log('Window lost focus - cheating attempt');
      // Send message to ui.js to fetch student info from webview and report
      mainWindow.webContents.send('trigger-cheat', 'blur_event');
    }
  });

  mainWindow.on('close', (e) => {
    if (isExamActive && !app.isQuiting) {
      e.preventDefault(); // Don't allow closing while exam is active
    }
  });
}

app.whenReady().then(() => {
  // Automatically grant all permissions requested by the webview (Camera, Microphone, Screen Share, Fullscreen, etc.)
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });
  
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    return true;
  });

  createWindow();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Received from ui.js when webview starts exam
ipcMain.on('start-exam', () => {
  isExamActive = true;
  mainWindow.setKiosk(true); // Enter fullscreen lockdown
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  
  // Register strict shortcuts only during exam
  globalShortcut.register('Alt+Tab', () => {
    if (isExamActive) {
      console.log('Alt+Tab blocked');
      mainWindow.webContents.send('trigger-cheat', 'alt_tab_event');
    }
  });
  globalShortcut.register('CommandOrControl+C', () => {
    if (isExamActive) mainWindow.webContents.send('trigger-cheat', 'copy_paste_event');
  });
  globalShortcut.register('CommandOrControl+V', () => {
    if (isExamActive) mainWindow.webContents.send('trigger-cheat', 'copy_paste_event');
  });
  globalShortcut.register('Escape', () => {
    if (isExamActive) mainWindow.webContents.send('trigger-cheat', 'escape_event');
  });
});

// Received from ui.js when webview ends exam
ipcMain.on('end-exam', () => {
  isExamActive = false;
  mainWindow.setKiosk(false);
  mainWindow.setAlwaysOnTop(false);
  globalShortcut.unregisterAll();
});

// Send cheating to backend
ipcMain.on('student-info-reply', async (event, data) => {
  if (!isExamActive) return;
  try {
    const { name, reason } = data;
    let message = 'User attempted to cheat.';
    if (reason === 'blur_event') message = 'User clicked outside the examination browser or switched windows.';
    if (reason === 'copy_paste_event') message = 'User attempted to Copy/Paste content.';
    if (reason === 'escape_event') message = 'User attempted to escape full screen.';
    if (reason === 'alt_tab_event') message = 'User attempted to use Alt+Tab to switch apps.';

    await axios.post('http://127.0.0.1:3000/api/cheat', {
      name: name || 'Unknown Student',
      message: message
    });
    console.log(`Cheating alert sent for ${name} due to ${reason}`);
  } catch (err) {
    console.error('Failed to send cheating alert:', err.message);
  }
});
