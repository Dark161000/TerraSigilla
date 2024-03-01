const { contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('ipc', {
    ipcRenderer: ipcRenderer,
    /*  received front-end | send back-end  */
    search: (country, city) => ipcRenderer.send('search', country, city),
});