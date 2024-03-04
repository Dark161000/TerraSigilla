const fs = require('fs'),
path = require('path');

async function findDuplicates(e, filePath, info) {
    const fileData = fs.readFileSync(filePath, "utf-8", (err) => {if (err) {console.error('Error reading file: ', err)}}).split('\n');
    for (let i = 0; i < fileData.length; i++) {
        if (fileData[i] === info.replaceAll('\n','')) {
            e.send('duplicateRow', i);
            return true;
        }
        
    }
    return false;
}

module.exports = {
    findDuplicates: findDuplicates,
}