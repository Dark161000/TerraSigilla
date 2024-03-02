const { contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('ipc', {
    ipcRenderer: ipcRenderer,
    // SENDERS:  receive front-end | send back-end
    search: (country, city) => ipcRenderer.send('search', country, city),
    // LISTENERS
    preRenderTable: () => ipcRenderer.on('preRenderTable', (e, isHeaderOnly, tableData) => {
        let htmlCode = '';
        const table = document.querySelector('#dataTable'),
        data = tableData.replaceAll('"', ''); //Remove all double quotes

        if (isHeaderOnly) {
            htmlCode += '<thead><tr>';
            data.replace('\n','').split('::').forEach(el => htmlCode += `<th>${el}</th>`);
            htmlCode += '</tr></thead>';

            table.innerHTML = htmlCode;
        } else {
            const dataRows = data.split('\n');

            //Add header
            htmlCode += '<thead><tr>';
            dataRows[0].split('::').forEach(el => htmlCode += `<th>${el}</th>`);
            htmlCode += '</tr></thead>';
            //Add body
            htmlCode += '<tbody>';
            for (let i = 1; i < dataRows.length; i++) {
                htmlCode += '<tr>'
                dataRows[i].split('::').forEach(el => htmlCode += `<td>${el}</td>`);
                htmlCode += '</tr>'
            }
            htmlCode += '</tbody>';

            table.innerHTML = htmlCode;
        }
    }),
});