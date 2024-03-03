const { contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('ipc', {
    ipcRenderer: ipcRenderer,
    // SENDERS:  receive front-end | send back-end
    search: (country, city) => ipcRenderer.send('search', country, city),
    // LISTENERS
    loadStart: () => ipcRenderer.on('loadStart', (e) => {
        document.querySelector('#loadingBox').style.display = 'block';
        document.querySelector('#form fieldset').setAttribute('disabled', 'disabled');
    }),
    loadEnd: () => ipcRenderer.on('loadEnd', (e) => {
        document.querySelector('#loadingBox').removeAttribute('style');
        document.querySelector('#innerBar').removeAttribute('style');
        document.querySelector('#outerBar p').innerHTML = '0%';
        document.querySelector('#form fieldset').removeAttribute('disabled');
    }),
    progressBarPercent: () => ipcRenderer.on('progressBarPercent', (e, total, current) => {
        const percent = current * 100 / total;
        document.querySelector('#outerBar p').innerHTML = `${Math.floor(percent)}%`;
        document.querySelector('#innerBar').style.width = `${percent * 0.01 * 176}px`;
    }),
    preRenderTable: () => ipcRenderer.on('preRenderTable', (e, isHeaderOnly, tableData) => {
        let htmlCode = '';
        const table = document.querySelector('#dataTable'),
        data = tableData.replaceAll('"', ''); //Remove all double quotes

        if (isHeaderOnly) {
            htmlCode += '<thead><tr>';
            data.replace('\n','').split('::').forEach(el => htmlCode += `<th>${el}</th>`);
            htmlCode += '</tr></thead><tbody></tbody>';

            table.innerHTML = htmlCode;
        } else {
            const dataRows = data.split('\n');

            //Add header
            htmlCode += '<thead><tr>';
            dataRows[0].split('::').forEach(el => htmlCode += `<th>${el}</th>`);
            htmlCode += '</tr></thead>';
            //Add body
            htmlCode += '<tbody>';
            for (let i = 1; i < dataRows.length - 1; i++) {
                htmlCode += '<tr>'
                for (let j = 0; j < dataRows[i].split('::').length; j++) {
                    htmlCode += `<td>${dataRows[i].split('::')[j]}</td>`;
                }
                htmlCode += '</tr>'
            }
            htmlCode += '</tbody>';

            table.innerHTML = htmlCode;
        }
    }),
    appendTable: () => ipcRenderer.on('appendTable', (e, rowInfo) => {
        let htmlCode = '';
        const table = document.querySelector('#dataTable tbody'),
        data = rowInfo.replaceAll('"', '').replaceAll('\n', ''); //Remove all double quotes

        htmlCode += '<tr>';
        data.replace('\n','').split('::').forEach(el => htmlCode += `<td>${el}</td>`);
        htmlCode += '</tr>';

        table.innerHTML += htmlCode;
    }),
});