const { ipcRenderer } = require('electron');

const webview = document.getElementById('webview');
const urlbar = document.getElementById('urlbar');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const reloadBtn = document.getElementById('reload-btn');
const goBtn = document.getElementById('go-btn');
const exitBtn = document.getElementById('exit-btn');
const permBtn = document.getElementById('perm-btn');
const toolbar = document.getElementById('toolbar');

// Ask OS for permissions
permBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    alert("Camera and Microphone permissions successfully granted to the Browser!");
    stream.getTracks().forEach(track => track.stop());
    webview.reload();
  } catch (err) {
    alert("Failed to get permissions: " + err.message + ". Please check your Windows/OS Privacy settings to ensure Desktop Apps can access the camera and microphone.");
  }
});

// Inject the preload script dynamically so the webview can communicate with main process
// The preload script must be injected before webview starts running scripts
const path = require('path');
const preloadUrl = 'file://' + path.join(__dirname, 'preload.js').replace(/\\/g, '/');
webview.setAttribute('preload', preloadUrl);

// Navigation controls
backBtn.addEventListener('click', () => { if (webview.canGoBack()) webview.goBack(); });
forwardBtn.addEventListener('click', () => { if (webview.canGoForward()) webview.goForward(); });
reloadBtn.addEventListener('click', () => { webview.reload(); });

goBtn.addEventListener('click', () => {
  let url = urlbar.value.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'http://' + url;
  }
  webview.loadURL(url);
});

urlbar.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    goBtn.click();
  }
});

// Update URL bar when webview navigates
webview.addEventListener('did-navigate', (e) => {
  urlbar.value = e.url;
});
webview.addEventListener('did-navigate-in-page', (e) => {
  urlbar.value = e.url;
});

// Listen to messages from main process (e.g. cheating triggered by blur, etc)
ipcRenderer.on('trigger-cheat', (event, reason) => {
  // Pass the request down to the webview to fetch student info
  webview.send('request-student-info', reason);
});

// Listen to exam state changes from main process
ipcRenderer.on('exam-started', () => {
  // Hide standard toolbar controls during exam to prevent cheating
  urlbar.disabled = true;
  goBtn.style.display = 'none';
  permBtn.style.display = 'none';
  backBtn.disabled = true;
  forwardBtn.disabled = true;
  reloadBtn.disabled = true;
  
  // Show exit button
  exitBtn.style.display = 'block';
  
  // Optionally hide toolbar completely or just change color
  toolbar.style.backgroundColor = '#f8d7da'; // light red to indicate lockdown
});

ipcRenderer.on('exam-ended', () => {
  // Restore normal browsing mode
  urlbar.disabled = false;
  goBtn.style.display = 'block';
  permBtn.style.display = 'block';
  backBtn.disabled = false;
  forwardBtn.disabled = false;
  reloadBtn.disabled = false;
  
  exitBtn.style.display = 'none';
  toolbar.style.backgroundColor = '#e3e5e8';
});

// Handle Exit Button
exitBtn.addEventListener('click', () => {
  if (confirm("Are you sure you want to exit the secure examination mode? This will end the proctoring session.")) {
    ipcRenderer.send('end-exam');
    // Reload the React app to reset state back to dashboard
    webview.executeJavaScript(`window.location.reload();`);
  }
});
