const header = document.querySelector('header'),
wrapper = document.querySelector('#pageWrapper'),
userInput = document.querySelector('#userInput'),
countrySelect = document.querySelector('#country'),
citySelect = document.querySelector('#city'),
form = document.querySelector('#searchForm'),
rightSide = document.querySelector('#mapResults'),
mapViewer = document.querySelector('#map'),
searchBtn = document.querySelector('#searchBtn'),
table = document.querySelector('#results'),
footer = document.querySelector('footer');

//Move map to location from selected dropdown
function focusMap(country, city, z = 1) {
    const mapUrl = `https://maps.google.com/maps?hl=en&q=${city}+${country}&t=&z=${z}&ie=UTF8&iwloc=B&output=embed`;
    mapViewer.setAttribute('src', mapUrl);
}

//Move map to selected row from location
function focusCoordsMap(coords) {
    const mapUrl = `https://maps.google.com/maps?hl=en&q=${coords}&t=&z=17&ie=UTF8&iwloc=B&output=embed`;
    mapViewer.setAttribute('src', mapUrl);
}

//Show HERE Map
function hereMap() {
    var platform = new H.service.Platform({
        'apikey': window.ipc.apikey()
    });
}

function tableSort(e, column) {
    //Give down arrow to know column that is being sorted
    table.querySelectorAll('th').forEach(el => {el.innerText = el.innerText.replaceAll('▼','')});
    e.target.innerText += '▼';
    
    const tbody = table.querySelector('tbody')
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
    window.ipc.search(countrySelect.value, citySelect.value);
    });

    //Add event listener to cell
    document.querySelector('#results').addEventListener('click',(e) => {
        if (e.target.tagName === 'TH') {//Sort according to selected row
            const column = e.target.cellIndex;
            tableSort(e, column);
        } else if (e.target.tagName === 'TD') {//Focus coords on map from table
            focusCoordsMap(e.target.parentElement.lastElementChild.textContent);
        }
    });

    //Listeners
    window.ipc.loadStart();
    window.ipc.loadEnd();
    window.ipc.progressBarPercent();
    window.ipc.preRenderTable();
    window.ipc.appendTable();
    window.ipc.duplicateRow();
});