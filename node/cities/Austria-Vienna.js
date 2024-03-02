const puppeteer = require('puppeteer'),
axios = require('axios'),
jsdom = require('jsdom'),
http = require('http'),
fs = require('fs'),
path = require('path');

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

/*async function getData() {  
    fs.writeFile('../csv/Austria-Vienna.csv','"zone","arbeiten","maßnahmen","termin","kontakt","coordinates"', function (err) {
        if (err) throw err;
        console.log('Created!');
    });

    const mapOfViennaURL = 'https://m.wien.gv.at/stadtplan/#base=karte&overlay=adressen&zoom=11&layer=baustelle%2Ceinbahn&lon=16.4372&lat=48.3774';

    const browser = await puppeteer.launch({headless: false, defaultViewport: {width:1920, height:1080}});
    const page = await browser.newPage();
    const navigationPromise = page.waitForNavigation({waitUntil: "networkidle0", timeout: 0});
    await page.goto(mapOfViennaURL,{waitUntil: "networkidle0", timeout: 0});
    await navigationPromise;
    const body = await page.content();

    var { window: { document } } = new jsdom.JSDOM(body);

    await page.evaluate(() =>{
        document.querySelectorAll('g > path').forEach(el => el.remove());
        document.querySelectorAll('.leaflet-marker-icon.leaflet-zoom-animated.leaflet-interactive').forEach(el => el.setAttribute('onclick', 'this.remove()'));
    });

    const construction = await page.$$('.leaflet-marker-icon.leaflet-zoom-animated.leaflet-interactive');
    let cCount = construction.length;

    var { window: { document } } = new jsdom.JSDOM(body);

    while (cCount >= 1) {
        await page.click('.leaflet-marker-icon.leaflet-zoom-animated.leaflet-interactive');
        await delay(2000);
        await page.waitForSelector('.leaflet-popup-content');
        const coordinates = await page.evaluate(() => {
            const currentUrl = window.location.href;
            const currentLat = +currentUrl.substring(currentUrl.search('lat')+4,currentUrl.length);
            const currentLon = +currentUrl.substring(currentUrl.search('lon')+4, currentUrl.search('lat') - 1);

            const pxy = 0.0004569; //0.0004347;
            const pxx = 0.0006866;

            const currentSizeX = window.innerWidth;
            const currentSizeY = window.innerHeight;

            const elementX = document.querySelector('.leaflet-popup.leaflet-zoom-animated').getBoundingClientRect().x + document.querySelector('.leaflet-popup.leaflet-zoom-animated').getBoundingClientRect().width/2; //document.querySelector('.leaflet-marker-icon.leaflet-zoom-animated.leaflet-interactive').getBoundingClientRect().x + 9;
            const elementY = document.querySelector('.leaflet-popup.leaflet-zoom-animated').getBoundingClientRect().y + document.querySelector('.leaflet-popup.leaflet-zoom-animated').getBoundingClientRect().height + (26.87/2);//document.querySelector('.leaflet-marker-icon.leaflet-zoom-animated.leaflet-interactive').getBoundingClientRect().y + 23;

            const lon = currentLon + ((elementX - (currentSizeX/2)) * pxx);
            const lat = currentLat + (((currentSizeY/2) - elementY) * pxy);

            return `${lat}, ${lon}`;
        });
        const data = await page.evaluate(() => {
            const zone = document.querySelectorAll('.leaflet-popup-content > strong')[0].textContent;
            const arbeiten = document.querySelectorAll('.leaflet-popup-content > strong')[1].nextSibling.textContent;
            const maßnahmen = document.querySelectorAll('.leaflet-popup-content > strong')[2].nextSibling.textContent;
            const termin = document.querySelectorAll('.leaflet-popup-content > strong')[3].nextSibling.textContent;
            const kontakt = document.querySelectorAll('.leaflet-popup-content > strong')[4].nextSibling.textContent;

            return `"${zone}","${arbeiten}","${maßnahmen}","${termin}","${kontakt}"`;
        });                        
        await page.click('.leaflet-popup-close-button');
        console.clear();
        console.log(((construction.length-cCount)/construction.length)*100,'%');
        console.log(`${data} ${coordinates}`);
        await delay(2000);

        fs.appendFile('Salzburg.csv', `\r\n${data},"${coordinates}"`, function(err){
            if (err) throw err;
        });
        cCount--;
    }
    await browser.close();
    clearInterval(intervalId);  
}*/

async function getData(e) {
    let geoPoint = '';
    let geoLine = '';

    //get data from js file
    http.get("http://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=1.1.0&typeName=ogdwien:BAUSTELLENPKTOGD&srsName=EPSG:4326&outputFormat=text/javascript&format_options=callback:wienmapBAUSTELLENPKTOGD.callback&charset=UTF-8&EXCEPTIONS=text/javascript", (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on('end', () => {
            geoPoint = data.replaceAll('wienmapBAUSTELLENPKTOGD.callback(', '').replaceAll('})', '}');
        });
    });

    http.get("http://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=1.1.0&typeName=ogdwien:BAUSTELLENLINOGD&srsName=EPSG:4326&outputFormat=text/javascript&format_options=callback:wienmapBAUSTELLENLIN2PKTOGD.callback&charset=UTF-8&EXCEPTIONS=text/javascript", (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on('end', () => {
            geoLine = data.replaceAll('wienmapBAUSTELLENLIN2PKTOGD.callback(', '').replaceAll('})', '}');
        });
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
        lineString = geoLineObj.features[i].geometry.coordinates.toString().replaceAll(',48', ' 48').replaceAll(',16',', 16'),
        coords = `${geoLineObj.features[i].geometry.coordinates[0][1]}, ${geoLineObj.features[i].geometry.coordinates[0][0]}`,
        info = `"${id}"::"${bezirk}"::"${bezeichnung}"::"${arbeiten}"::"${maßnahmen}"::"${beginn}"::"${ende}"::"${antragsteller}"::"${kontakt}"::"${tel}"::"${lineString}"::"${coords}"\n`

        fs.appendFileSync(path.join(__dirname,'../../data/Austria-Vienna.txt'), info ,(err) => {if(err){console.error('Error writing to file: ', err)}});
        await e.send('appendTable',info);
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
        coords = `${geoPointObj.features[i].geometry.coordinates.toString()}`,
        info = `"${id}"::"${bezirk}"::"${bezeichnung}"::"${arbeiten}"::"${maßnahmen}"::"${beginn}"::"${ende}"::"${antragsteller}"::"${kontakt}"::"${tel}"::""::"${coords}"\n`

        fs.appendFileSync(path.join(__dirname,'../../data/Austria-Vienna.txt'), info ,(err) => {if(err){console.error('Error writing to file: ', err)}});
        await e.send('appendTable',info);
    }
}

module.exports = {
    search: getData,
}