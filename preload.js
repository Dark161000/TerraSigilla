const { contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('ipc', {
    ipcRenderer: ipcRenderer,
    // SENDERS:  receive front-end | send back-end
    search: (country, city) => ipcRenderer.send('search', country, city),
    // LISTENERS
    renderTable: () => ipcRenderer.on('renderTable', (e, isHeaderOnly, tableData) => {
        let htmlCode = '';
        const table = document.querySelector('#dataTable'),
        data = tableData.replaceAll('"', ''); //Remove all double quotes

        console.log(data.replace('\n','').split('::'));
        if (isHeaderOnly) {
            htmlCode += '<thead><tr>';
            data.replace('\n','').split('::').forEach(el => htmlCode += `<th>${el}</th>`);
            htmlCode += '</tr></thead>';

            table.innerHTML = htmlCode;
        } else {

        }
    }),
});