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
    const soCoords = '38.060524335714206,13.266775363873888',
    neCoords = '38.224868004205916,13.458455888264135';

    //Get data from XHR
    const req = https.get(`https://www.cciss.it/web/cciss/situazione-della-viabilita?p_p_id=2_WAR_ccissservizimapsportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_cacheability=cacheLevelPage&p_p_col_id=column-2&p_p_col_pos=3&p_p_col_count=4&_2_WAR_ccissservizimapsportlet_so=${soCoords}&_2_WAR_ccissservizimapsportlet_ne=${neCoords}&_2_WAR_ccissservizimapsportlet_z=17`, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on('end', () => {
            apiData = data.replaceAll('wienmapBAUSTELLENPKTOGD.callback(', '').replaceAll('})', '}');
        });
    });

    //Throw error if error found
    req.on('error', (err) => {
        if (err.message === 'unable to get local issuer certificate') {
            throw new Error(`If you are using zscaler, close it and try again \n ${err}`);
        } else {
            throw new Error(`${err}`);
        }
    });
    //Throw error if site not found
    req.on('response', (res) => {
        if (res.statusCode === 404) {
            throw new Error(`Website not responding. Please try again later.`);
        }
    });

    while (apiData === '') {
        await delay(1000);
    }

    //Parse to JSON
    const apiDataObj = await JSON.parse(apiData);

    //Create file if it doesn't exist and show header table, if it exist, show data in table
    if (!fs.existsSync(path.join(__dirname,'../../data/Italy-Palermo.txt'))) {
        const header = '"id"::"dataPubblicazione"::"titolo"::"trattoEvento"::"evento"::"dettaglio"::"priorita"::"fonte"::"lineString"::"coordinate"\n';
        fs.writeFileSync(path.join(__dirname,'../../data/Italy-Palermo.txt'), header, (err) => {if(err){console.error('Error writing to file: ', err)}});
        await e.send('preRenderTable', true, header);
    } else {
        const fileData = fs.readFileSync(path.join(__dirname,'../../data/Italy-Palermo.txt'),'utf-8', (err) => {if(err){console.error('Error reading file: ', err)}});
        await e.send('preRenderTable', false, fileData);
    }

    //Declare total of features and let for current
    const totalFeatures = apiDataObj.eventiTrafficoList.length;
    let currentFeatures = 0;

    //Begin fetching to file
    for (let i = 0; i < totalFeatures; i++) {
        const id = apiDataObj.eventiTrafficoList[i].oid,
        dataPubblicazione = apiDataObj.eventiTrafficoList[i].dataPubblicazione,
        titolo = apiDataObj.eventiTrafficoList[i].titolo,
        trattoEvento = apiDataObj.eventiTrafficoList[i].trattoEvento,
        evento = apiDataObj.eventiTrafficoList[i].evento,
        dettaglio = apiDataObj.eventiTrafficoList[i].dettaglio.replaceAll('\n', ''),
        priorita = apiDataObj.eventiTrafficoList[i].priorita,
        fonte = apiDataObj.eventiTrafficoList[i].fonte,
        lineString = `${apiDataObj.eventiTrafficoList[i].percorsoTO.coordinateMappaInizioTO.coordinateMappaCX}, ${apiDataObj.eventiTrafficoList[i].percorsoTO.coordinateMappaInizioTO.coordinateMappaCY}; ${apiDataObj.eventiTrafficoList[i].percorsoTO.coordinateMappaFineTO.coordinateMappaCX}, ${apiDataObj.eventiTrafficoList[i].percorsoTO.coordinateMappaFineTO.coordinateMappaCY}`,
        coordinate = `${apiDataObj.eventiTrafficoList[i].percorsoTO.coordinateMappaInizioTO.coordinateMappaCY}, ${apiDataObj.eventiTrafficoList[i].percorsoTO.coordinateMappaInizioTO.coordinateMappaCX}`,
        info = `"${id}"::"${dataPubblicazione}"::"${titolo}"::"${trattoEvento}"::"${evento}"::"${dettaglio}"::"${priorita}"::"${fonte}"::"${lineString}"::"${coordinate}"\n`

        if (!await nodeScripts.findDuplicates(e, path.join(__dirname,'../../data/Italy-Palermo.txt'), info)) {
            fs.appendFileSync(path.join(__dirname,'../../data/Italy-Palermo.txt'), info ,(err) => {if(err){console.error('Error writing to file: ', err)}});
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