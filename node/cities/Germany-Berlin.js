const https = require('https'),
fs = require('fs'),
path = require('path'),
nodeScripts = require('../nodeScripts');

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function getData(e) {
    await e.send('loadStart');

    let apiData = '';

    //Get data from json
    https.get(`https://api.viz.berlin.de/daten/baustellen_sperrungen.json`, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on('end', () => {
            apiData = data.replaceAll('wienmapBAUSTELLENPKTOGD.callback(', '').replaceAll('})', '}');
        });
    });

    while (apiData === '') {
        await delay(1000);
    }

    //Parse to JSON
    const apiDataObj = await JSON.parse(apiData);

    //Create file if it doesn't exist and show header table, if it exist, show data in table
    if (!fs.existsSync(path.join(__dirname,'../../data/Germany-Berlin.txt'))) {
        const header = '"id"::"typ"::"auswirkung"::"gültig_ab"::"gültig_bis"::"straße"::"abschnitt"::"beschreibung"::"lineString"::"coordinate"\n';
        fs.writeFileSync(path.join(__dirname,'../../data/Germany-Berlin.txt'), header, (err) => {if(err){console.error('Error writing to file: ', err)}});
        await e.send('preRenderTable', true, header);
    } else {
        const fileData = fs.readFileSync(path.join(__dirname,'../../data/Germany-Berlin.txt'),'utf-8', (err) => {if(err){console.error('Error reading file: ', err)}});
        await e.send('preRenderTable', false, fileData);
    }

    //Declare total of features and let for current
    const totalFeatures = apiDataObj.features.length;
    let currentFeatures = 0;

    //Begin fetching to file
    for (let i = 0; i < totalFeatures; i++) {
        const id = apiDataObj.features[i].properties.id,
        typ = apiDataObj.features[i].properties.subtype,
        auswirkung = apiDataObj.features[i].properties.severity,
        gültig_ab = apiDataObj.features[i].properties.validity.from,
        gültig_bis = apiDataObj.features[i].properties.validity.to,
        straße = apiDataObj.features[i].properties.street,
        abschnitt = apiDataObj.features[i].properties.section,
        beschreibung = apiDataObj.features[i].properties.content;
        let lineString = '';
        let coordinate = '';
        try {
            lineString = apiDataObj.features[i].geometry.geometries[1].coordinates.toString().replaceAll(',52',', 52').replaceAll(',13',', 13');
            coordinate = `${apiDataObj.features[i].geometry.geometries[0].coordinates[1]}, ${apiDataObj.features[i].geometry.geometries[0].coordinates[0]}`;
        } catch (err) {
            coordinate = `${apiDataObj.features[i].geometry.coordinates[1]}, ${apiDataObj.features[i].geometry.coordinates[0]}`;
        }        
        info = `"${id}"::"${typ}"::"${auswirkung}"::"${gültig_ab}"::"${gültig_bis}"::"${straße}"::"${abschnitt}"::"${beschreibung}"::"${lineString}"::"${coordinate}"\n`

        if (!await nodeScripts.findDuplicates(e, path.join(__dirname,'../../data/Germany-Berlin.txt'), info)) {
            fs.appendFileSync(path.join(__dirname,'../../data/Germany-Berlin.txt'), info ,(err) => {if(err){console.error('Error writing to file: ', err)}});
            await e.send('appendTable',info);
        }

        currentFeatures += 1;
        await e.send('progressBarPercent', totalFeatures, currentFeatures);
    }

    await e.send('loadEnd');
}

module.exports = {
    search: getData,
}