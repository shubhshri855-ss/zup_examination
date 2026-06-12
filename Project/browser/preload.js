const { contextBridge, ipcRenderer } = require('electron');

ipcRenderer.on('request-student-info', (event, reason) => {
  let email = localStorage.getItem('auth_email') || '';
  let name = email ? email.split('@')[0] : 'Unknown Student';
  
  ipcRenderer.send('student-info-reply', {
    name,
    reason
  });
});

contextBridge.exposeInMainWorld('electronAPI', {
  startExam: () => ipcRenderer.send('start-exam'),
  endExam: () => ipcRenderer.send('end-exam'),
  terminateExam: () => ipcRenderer.send('end-exam')
});
