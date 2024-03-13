const header = document.querySelector('header'),
wrapper = document.querySelector('#pageWrapper'),
userInput = document.querySelector('#userInput'),
countrySelect = document.querySelector('#country'),
citySelect = document.querySelector('#city'),
form = document.querySelector('#searchForm'),
languageFromSelect = document.querySelector('#languageFrom'),
languageToSelect = document.querySelector('#languageTo'),
translateForm = document.querySelector('#translateForm'),
rightSide = document.querySelector('#mapResults'),
mapViewer = document.querySelector('#map'),
searchBtn = document.querySelector('#searchBtn'),
table = document.querySelector('#results'),
sourceBox = document.querySelector('#sourceWrapper'),
sourceLink = document.querySelector('#sourceLink'),
footer = document.querySelector('footer');
let map = '',
platform = '';

//Show HERE Map
function hereMap() {
    platform = new H.service.Platform({
        'apikey': window.ipc.apiKey()
    });

    const defaultLayers = platform.createDefaultLayers();

    // Instantiate (and display) a map object:
    map = new H.Map(document.querySelector('#map'), defaultLayers.vector.normal.map, {
        zoom: 2,
        center: { lat: 21, lng: -38 },
        pixelRatio: window.devicePixelRatio || 1
    });
    window.addEventListener('resize', () => map.getViewPort().resize());
    const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
    const ui = H.ui.UI.createDefault(map, defaultLayers, 'en-US');
}

//Move map to location from selected dropdown
function focusMap(country, city, z = 1) {
    map.removeObjects(map.getObjects());
    const service = platform.getSearchService();
    service.geocode({
        q: `${city} ${country}`
    }, (result) => {
        // Add a marker for each location found
        result.items.forEach((item) => {
            const marker = new H.map.Marker(item.position);
            map.addObject(marker);
            map.setCenter(item.position);
            map.setZoom(z);
        });
    }, alert);
}

//Move map to selected row from location
function focusCoordsMap(coords) {
    map.removeObjects(map.getObjects());
    const [latitude, longitude] = coords.replaceAll(' ','').split(',');
    const marker = new H.map.Marker({ lat: parseFloat(latitude), lng: parseFloat(longitude) });
    map.addObject(marker);
    map.setCenter(marker.getGeometry());
    map.setZoom(17);
}

function lineStringMap(lineStringText) {
    const lineStringArray = lineStringText.replaceAll(' ', '').split(';');
    let lineString = new H.geo.LineString();

    lineStringArray.forEach(el => {
        const [longitude,latitude] = el.split(',');
        lineString.pushPoint({lat: parseFloat(latitude), lng: parseFloat(longitude)});
    });

    map.addObject(new H.map.Polyline(lineString, {style: {lineWidth: 4}}));
}

function tableSort(e, column) {
    //Give down arrow to know column that is being sorted
    table.querySelectorAll('th').forEach(el => {el.innerText = el.innerText.replaceAll('▼','')});
    e.target.innerText += '▼';
    
    const tbody = e.target.parentElement.parentElement.parentElement.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    // Sort the array based on the content of the selected column
    rows.sort((a, b) => {
        const aValue = a.cells[column].innerText;
        const bValue = b.cells[column].innerText;

        // Parse the values appropriately for numeric sorting
        return aValue.localeCompare(bValue, undefined, { numeric: true });
    });

    // Update the HTML content of the tbody with the sorted rows
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}

//Hide/unhide cities from country selection
function cityListUpd(country) {
    citySelect.querySelectorAll('option:not(:first-child)').forEach(el => {
        if (el.attributes.country.value === country) {
            el.style.display = 'initial';
        } else {
            el.style.display = 'none';
        }
    });
}

//show sources
function showSource(country, city) {
    sourceLink.innerText = countries[`${country}`].cities[`${city}`].source.name;
    sourceLink.href = countries[`${country}`].cities[`${city}`].source.url;
}

//Apply styles according to window size
function itemResize() {
    const screenSizeW = window.innerWidth,
    userInputW = userInput.offsetWidth,
    screenSizeH =window.innerHeight,
    headerH = header.offsetHeight,
    footerH = footer.offsetHeight;

    rightSide.style.maxWidth = `${screenSizeW-userInputW}px`;
    userInput.style.height = `${screenSizeH - headerH}px`;
    mapViewer.style.height = `${(screenSizeH - headerH - footerH)/2}px`;
    table.style.height = `${(screenSizeH - headerH - footerH)/2}px`;
}

itemResize();

document.addEventListener('DOMContentLoaded',() => {
    window.addEventListener('resize', itemResize);
    hereMap();

    //Focus country in map
    countrySelect.addEventListener('change', (e) => {
        country = e.target.value,
        zoom = countries[country].zoom;
        focusMap(country, '', zoom);
        cityListUpd(country);
    });

    //Focus city-country in map
    citySelect.addEventListener('change', (e) => {
        const city = e.target.value,
        country = countrySelect.value,
        zoom = countries[country].cities[city].zoom;
        focusMap(country, city, zoom);
    });

    //Prevent default when successfull submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        switch (e.submitter.value) {
            case 'Load': //Load previous data
                window.ipc.load(countrySelect.value, citySelect.value);
                sourceBox.style.display = 'none';
                break;
            case 'Search': //Make a new search
                window.ipc.search(countrySelect.value, citySelect.value);
                showSource(countrySelect.value, citySelect.value);
                sourceBox.style.display = 'block';
                break;
        }
    });

    //Prevent default when successfull submit on translation
    translateForm.addEventListener('submit', (e) => {
        e.preventDefault();

        let cellData = [];

        if (document.querySelector('#dataTable').innerHTML !== '') {
            document.querySelectorAll('#dataTable :is(th,td)').forEach( el => {
                cellData.push(el.innerText);
            });
        }

        document.querySelector('#form fieldset').setAttribute('disabled', 'disabled');
        document.querySelector('#translateWrapper fieldset').setAttribute('disabled', 'disabled');

        window.ipc.translateTable(languageFromSelect.value, languageToSelect.value, cellData);

        setTimeout(() => {
            document.querySelector('#form fieldset').removeAttribute('disabled');
            document.querySelector('#translateWrapper fieldset').removeAttribute('disabled');
        },5_000)
    });

    //Prevent default url click and open in default browser
    sourceLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.ipc.urlExternal(e.target.href);
    });

    //Add event listener to cell
    document.querySelector('#results').addEventListener('click',(e) => {
        if (e.target.tagName === 'TH') {//Sort according to selected row
            const column = e.target.cellIndex;
            tableSort(e, column);
        } else if (e.target.tagName === 'TD') {//Focus coords on map from table and show lineString
            const lastRow = e.target.parentElement.lastElementChild.textContent,
            beforeLastRow = e.target.parentElement.lastElementChild.previousElementSibling.textContent;

            focusCoordsMap(lastRow);
            if (beforeLastRow !== '') {
                lineStringMap(beforeLastRow);    
            }
        }
    });

    //Listeners
    window.ipc.loadStart();
    window.ipc.loadEnd();
    window.ipc.progressBarPercent();
    window.ipc.preRenderTable();
    window.ipc.appendTable();
    window.ipc.duplicateRow();
    window.ipc.translationValue();
});