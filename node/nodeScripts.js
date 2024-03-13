const fs = require('fs'),
path = require('path'),
{ GoogleTranslator } = require('@translate-tools/core/translators/GoogleTranslator'),
{ DeepLTranslator } = require('@translate-tools/core/translators/DeepLTranslator'),
gtranslator = new GoogleTranslator(),
dtranslator = new DeepLTranslator({apiKey: 'cb5ac0a9-ec18-45c6-befe-0f3e3be9a650:fx',});

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

async function translateTable(e, langFrom, langTo, data) {
    let translatedWords = [];

    //Google Translator
    await gtranslator.translateBatch(data, langFrom, langTo)
                     .then(res => {translatedWords.push(res)})
                     .catch(err => {console.error(err)});
    await e.send('translationValue', translatedWords[0]);

    //DeepL Translator
    /*const regex = /^[0-9!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~\s]*$/;
    for (let i = 0; i < data.length; i++) {
        if (!regex.test(data[i])) { //If there is not only numbers or symbols
            await dtranslator.translate(data[i], langFrom, langTo)
	                         .then((translate) => translatedWords.push(translate));
        } else {
            translatedWords.push(data[i]);
        }
    }
    await e.send('translationValue', translatedWords);*/
}

module.exports = {
    findDuplicates: findDuplicates,
    translateTable: translateTable,
}