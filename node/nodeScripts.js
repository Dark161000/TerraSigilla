const fs = require('fs'),
path = require('path'),
{ GoogleTranslator } = require('@translate-tools/core/translators/GoogleTranslator'),
{ DeepLTranslator } = require('@translate-tools/core/translators/DeepLTranslator'),
gtranslator = new GoogleTranslator();


function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

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

async function translateTable(e, langFrom, langTo, data, apiK) {
    await e.send('loadStart');
    const count = data.length;
    let currentCount = 0;
    let translatedWords = [];

    //Google Translator
    await gtranslator.translateBatch(data, langFrom, langTo)
                     .then(res => {
                        translatedWords.push(res);

                        currentCount++;
                        e.send('progressBarPercent', count, currentCount);
                     })
                     .catch(err => {console.error(err);});
    await e.send('translationValue', translatedWords[0]);

    //DeepL Translator
    /*const regex = /^[0-9!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~\s]*$/,
    dtranslator = new DeepLTranslator({apiKey: apiK,});
    for (let i = 0; i < data.length; i++) {
        if (!regex.test(data[i])) { //If there is not only numbers or symbols
            await dtranslator.translate(data[i], langFrom, langTo)
	                         .then((translate) => translatedWords.push(translate));
        } else {
            translatedWords.push(data[i]);
        }
    }
    await e.send('translationValue', translatedWords);*/

    await e.send('loadEnd', true);
}

module.exports = {
    findDuplicates: findDuplicates,
    translateTable: translateTable,
}