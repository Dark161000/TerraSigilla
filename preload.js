const { contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('ipc', {
    ipcRenderer: ipcRenderer,
    //FUNCTIONS
    apiKey: () => {return process.env.API_KEY_HERE},
    // SENDERS:  receive front-end | send back-end
    load: (country, city) => ipcRenderer.send('load', country, city),
    search: (country, city) => ipcRenderer.send('search', country, city),
    urlExternal:(url) => ipcRenderer.send('urlExternal', url),
    translateTable: (langFrom, langTo, data) => ipcRenderer.send('translateTable', langFrom, langTo, data),
    // LISTENERS
    loadStart: () => ipcRenderer.on('loadStart', (e) => {
        document.querySelector('#loadingBox').style.display = 'block';
        document.querySelector('#form fieldset').setAttribute('disabled', 'disabled');
        document.querySelector('#translateWrapper fieldset').setAttribute('disabled', 'disabled');
    }),
    loadEnd: () => ipcRenderer.on('loadEnd', (e, isTranslation = false) => {
        document.querySelector('#loadingBox').removeAttribute('style');
        document.querySelector('#innerBar').removeAttribute('style');
        document.querySelector('#outerBar p').innerHTML = '0%';
        document.querySelector('#form fieldset').removeAttribute('disabled');
        document.querySelector('#translateWrapper fieldset').removeAttribute('disabled');
        if (!isTranslation) {
            document.querySelectorAll('#dataTable td:nth-child(2)').forEach( el => { //Look for not found record in previous data
                if (el.innerText === '') {
                    el.innerText = 'Not Found';
                    el.setAttribute('class','notFoundRow');
                }
            });
            document.querySelector('#translatedTable').innerHTML = document.querySelector('#dataTable').innerHTML
        }
    }),
    progressBarPercent: () => ipcRenderer.on('progressBarPercent', (e, total, current) => {
        const percent = current * 100 / total;
        document.querySelector('#outerBar p').innerHTML = `${Math.floor(percent)}%`;
        document.querySelector('#innerBar').style.width = `${percent * 0.01 * 176}px`;
    }),
    preRenderTable: () => ipcRenderer.on('preRenderTable', (e, isHeaderOnly, tableData) => {
        let htmlCode = '';
        const table = document.querySelector('#dataTable'),
        translatedTable = document.querySelector('#translatedTable'),
        data = tableData.replaceAll('"', ''); //Remove all double quotes

        if (isHeaderOnly) {
            htmlCode += '<thead><tr><th>row</th><th>dataStatus</th>';
            data.replace('\n','').split('::').forEach(el => htmlCode += `<th>${el}</th>`);
            htmlCode += '</tr></thead><tbody></tbody>';

            table.innerHTML = htmlCode;
            translatedTable.innerHTML = htmlCode;
        } else {
            const dataRows = data.split('\n');

            //Add header
            htmlCode += '<thead><tr><th>row</th><th>dataStatus</th>';
            dataRows[0].split('::').forEach(el => htmlCode += `<th>${el}</th>`);
            htmlCode += '</tr></thead>';
            //Add body
            htmlCode += '<tbody>';
            for (let i = 1; i < dataRows.length - 1; i++) {
                htmlCode += `<tr><td>${i}</td><td></td>`;
                for (let j = 0; j < dataRows[i].split('::').length; j++) {
                    htmlCode += `<td>${dataRows[i].split('::')[j]}</td>`;
                }
                htmlCode += '</tr>';
            }
            htmlCode += '</tbody>';

            table.innerHTML = htmlCode;
            translatedTable.innerHTML = htmlCode;
        }
    }),
    appendTable: () => ipcRenderer.on('appendTable', (e, rowInfo) => {
        let htmlCode = '';
        const table = document.querySelector('#dataTable tbody'),
        data = rowInfo.replaceAll('"', '').replaceAll('\n', ''), //Remove all double quotes
        lRowNum = document.querySelector('#dataTable tbody tr:last-child td:first-child') === null ? 0 : Number(document.querySelector('#dataTable tbody tr:last-child td:first-child').innerText); //Number 0 for first row

        htmlCode += `<tr><td>${lRowNum + 1}</td><td class="newRow">New!</td>`; //Add 'new' status since it doesn't exist in previous data
        data.replace('\n','').split('::').forEach(el => htmlCode += `<td>${el}</td>`); //Add a number from last row
        htmlCode += '</tr>';

        table.innerHTML += htmlCode;
    }),
    duplicateRow: () => ipcRenderer.on('duplicateRow', (e, row) => {
        document.querySelectorAll('tr')[row].querySelector('td:nth-child(2)').innerHTML = 'Unchanged'; //unchanged status since it is found
        document.querySelectorAll('tr')[row].querySelector('td:nth-child(2)').setAttribute('class','unchangedRow');
    }),
    translationValue: () => ipcRenderer.on('translationValue', (e, translatedWords) => {
        const cells = document.querySelectorAll(`#translatedTable :is(th, td)`); //Apply to translated table and hide original table
        for (let i = 0; i < cells.length; i++) {
            cells[i].innerText = translatedWords[i];
        }
        document.querySelector('#dataTable').style.display = 'none';
        document.querySelector('#translatedTable').style.display = 'block';
    }),
});