const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
//const { setMainMenu } = require('./menu.js');
const fs = require('fs');
const path = require('path');

let win;

const createWindow = () => {
    win = new BrowserWindow({
        width: 1250,
        height: 1200,
        //icon: path.join(__dirname, 'calendar/images/icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    win.loadFile(path.join(__dirname, 'index.html'));

    //setMainMenu(win);
}

app.whenReady().then(() => {
    createWindow();

    ipcMain.on('search', (e, country, city) => {
        const jsFile = require(path.join(__dirname, `node/cities/${country}-${city}.js`));
        jsFile.search(e.sender);
    })
    ipcMain.on('urlExternal', (e, url) => {
        shell.openExternal(url);
    })
})