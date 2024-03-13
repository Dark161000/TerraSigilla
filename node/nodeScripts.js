const fs = require('fs'),
path = require('path'),
{ GoogleTranslator } = require('@translate-tools/core/translators/GoogleTranslator'),
translator = new GoogleTranslator();

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

async function translateTable(e, langFrom, langTo, data, type) {
    let translatedWords = [];
    await translator.translateBatch(data, langFrom, langTo).then(res => {translatedWords.push(res)}).catch(err => {console.error(err)});
    await e.send('translationValue', translatedWords[0], type);
}

module.exports = {
    findDuplicates: findDuplicates,
    translateTable: translateTable,
}