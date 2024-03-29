const http = require('http'),
fs = require('fs'),
path = require('path'),
nodeScripts = require('../nodeScripts');

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function getData(e) {
    await e.send('loadStart');
    let geoPoint = '';
    let geoLine = '';

    //get data from js file
    const req1 = http.get("http://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=1.1.0&typeName=ogdwien:BAUSTELLENPKTOGD&srsName=EPSG:4326&outputFormat=text/javascript&format_options=callback:wienmapBAUSTELLENPKTOGD.callback&charset=UTF-8&EXCEPTIONS=text/javascript", (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on('end', () => {
            geoPoint = data.replaceAll('wienmapBAUSTELLENPKTOGD.callback(', '').replaceAll('})', '}');
        });
    });

    //Throw error if error found
    req1.on('error', (err) => {
        throw new Error(`${err}`);
    });
    //Throw error if site not found
    req1.on('response', (res) => {
        if (res.statusCode === 404) {
            throw new Error(`Website not responding. Please try again later.`);
        }
    });

    const req2 = http.get("http://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=1.1.0&typeName=ogdwien:BAUSTELLENLINOGD&srsName=EPSG:4326&outputFormat=text/javascript&format_options=callback:wienmapBAUSTELLENLINOGD.callback&charset=UTF-8&EXCEPTIONS=text/javascript", (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on('end', () => {
            geoLine = data.replaceAll('wienmapBAUSTELLENLINOGD.callback(', '').replaceAll('})', '}');
        });
    });

    //Throw error if error found
    req2.on('error', (err) => {
        throw new Error(`${err}`);
    });
    //Throw error if site not found
    req2.on('response', (res) => {
        if (res.statusCode === 404) {
            throw new Error(`Website not responding. Please try again later.`);
        }
    });

    while (geoLine === '' || geoPoint === '') {
        await delay(1000);
    }

    //Parse to JSON
    const geoPointObj = await JSON.parse(geoPoint),
    geoLineObj = await JSON.parse(geoLine);

    //Create file if it doesn't exist and show header table, if it exist, show data in table
    if (!fs.existsSync(path.join(__dirname,'../../data/Austria-Vienna.txt'))) {
        const header = '"id"::"bezirk"::"bezeichnung"::"arbeiten"::"maßnahmen"::"beginn"::"ende"::"antragsteller"::"kontakt"::"tel"::"lineString"::"coords"\n';
        fs.writeFileSync(path.join(__dirname,'../../data/Austria-Vienna.txt'), header, (err) => {if(err){console.error('Error writing to file: ', err)}});
        await e.send('preRenderTable', true, header);
    } else {
        const fileData = fs.readFileSync(path.join(__dirname,'../../data/Austria-Vienna.txt'),'utf-8', (err) => {if(err){console.error('Error reading file: ', err)}});
        await e.send('preRenderTable', false, fileData);
    }

    //Declare total of features and let for current
    const totalFeatures = geoLineObj.features.length + geoPointObj.features.length;
    let currentFeatures = 0;

    //Begin fetching to file lineString
    for (let i = 0; i < geoLineObj.features.length; i++) {
        const id = geoLineObj.features[i].properties.OBJECTID,
        bezirk = geoLineObj.features[i].properties.BEZIRK,
        bezeichnung = geoLineObj.features[i].properties.BEZEICHNUNG,
        arbeiten = geoLineObj.features[i].properties.BEHINDERUNGSART,
        maßnahmen = geoLineObj.features[i].properties.PRESSETEXT,
        beginn = geoLineObj.features[i].properties.OBJEKT_BEGINN,
        ende = geoLineObj.features[i].properties.OBJEKT_ENDE,
        antragsteller = geoLineObj.features[i].properties.ANTRAGSTELLER,
        kontakt = geoLineObj.features[i].properties.ANSPRECHPERSON,
        tel = geoLineObj.features[i].properties.ANSPRECHPERSON_TEL,
        lineString = geoLineObj.features[i].geometry.coordinates.toString().replaceAll(',48', ', 48').replaceAll(',16','; 16'),
        coords = `${geoLineObj.features[i].geometry.coordinates[0][1]}, ${geoLineObj.features[i].geometry.coordinates[0][0]}`,
        info = `"${id}"::"${bezirk}"::"${bezeichnung}"::"${arbeiten}"::"${maßnahmen}"::"${beginn}"::"${ende}"::"${antragsteller}"::"${kontakt}"::"${tel}"::"${lineString}"::"${coords}"\n`

        if (!await nodeScripts.findDuplicates(e, path.join(__dirname,'../../data/Austria-Vienna.txt'), info)) {
            fs.appendFileSync(path.join(__dirname,'../../data/Austria-Vienna.txt'), info ,(err) => {if(err){console.error('Error writing to file: ', err)}});
            await e.send('appendTable',info);
        }

        currentFeatures += 1;
        await e.send('progressBarPercent', totalFeatures, currentFeatures);
    }
    
    //Begin fetching to file shapePoint
    for (let i = 0; i < geoPointObj.features.length; i++) {
        const id = geoPointObj.features[i].properties.OBJECTID,
        bezirk = geoPointObj.features[i].properties.BEZIRK,
        bezeichnung = geoPointObj.features[i].properties.BEZEICHNUNG,
        arbeiten = geoPointObj.features[i].properties.BEHINDERUNGSART,
        maßnahmen = geoPointObj.features[i].properties.PRESSETEXT,
        beginn = geoPointObj.features[i].properties.OBJEKT_BEGINN,
        ende = geoPointObj.features[i].properties.OBJEKT_ENDE,
        antragsteller = geoPointObj.features[i].properties.ANTRAGSTELLER,
        kontakt = geoPointObj.features[i].properties.ANSPRECHPERSON,
        tel = geoPointObj.features[i].properties.ANSPRECHPERSON_TEL,
        coords = `${geoPointObj.features[i].geometry.coordinates[1]}, ${geoPointObj.features[i].geometry.coordinates[0]}`,
        info = `"${id}"::"${bezirk}"::"${bezeichnung}"::"${arbeiten}"::"${maßnahmen}"::"${beginn}"::"${ende}"::"${antragsteller}"::"${kontakt}"::"${tel}"::""::"${coords}"\n`

        if (!await nodeScripts.findDuplicates(e, path.join(__dirname,'../../data/Austria-Vienna.txt'), info)) {
            fs.appendFileSync(path.join(__dirname,'../../data/Austria-Vienna.txt'), info ,(err) => {if(err){console.error('Error writing to file: ', err)}});
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