const WEATHER_API_KEY = '47ef032222172dda4ea635c94c5957ef';
const UNSPLASH_ACCESS_KEY = 'HVLSky8ZlP3SDKXnDNFaIVNvTf7R6DwwNjr0yPBPa20';
const MAPTILER_API_KEY = 'ZHQR7iuwI2vSLPjpXP1G';
const destinationInput = document.getElementById('destination-input');
const searchButton = document.getElementById('search-button');
const resultsSection = document.getElementById('results-section');
const destinationTitle = document.getElementById('destination-title');
const weatherDataContainer = document.getElementById('weather-data');
const photosGrid = document.getElementById('photos-grid');
const loadingSpinner = document.getElementById('loading-spinner');
const historyList = document.getElementById('history-list');
const themeToggle = document.getElementById('checkbox');
let map; 
searchButton.addEventListener('click', () => {
    const destination = destinationInput.value.trim();
    if (destination) {
        fetchData(destination);
    } else {
        alert('Please enter a destination.');
    }
});
themeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
    // Save theme preference
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark-mode');
    } else {
        localStorage.setItem('theme', 'light-mode');
    }
});
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark-mode') {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
    }
});
async function fetchData(destination) {
    loadingSpinner.classList.remove('hidden');
    resultsSection.classList.add('hidden');

    try {
        const [weatherResponse, photosResponse] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${destination}&appid=${WEATHER_API_KEY}&units=metric`),
            fetch(`https://api.unsplash.com/search/photos?query=${destination}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=9`)
        ]);

        if (!weatherResponse.ok) throw new Error('Weather data not found.');
        if (!photosResponse.ok) throw new Error('Photo data not found.');

        const weather = await weatherResponse.json();
        const photos = await photosResponse.json();
        
        displayAllData(destination, weather, photos.results);
        saveToHistory(destination);

    } catch (error) {
        console.error('Error fetching data:', error);
        alert(`Failed to fetch data: ${error.message}. Please try another location.`);
    } finally {
        loadingSpinner.classList.add('hidden');
    }
}
function displayAllData(destination, weather, photoArray) {
    resultsSection.classList.remove('hidden');
    destinationTitle.textContent = destination;
    
    displayWeather(weather);
    displayPhotos(photoArray);
    initializeMap(weather.coord.lat, weather.coord.lon, destination);
}

function displayWeather(data) {
    weatherDataContainer.innerHTML = `
        <p><strong>Temperature:</strong> ${data.main.temp}°C</p>
        <p><strong>Conditions:</strong> ${data.weather[0].description}</p>
        <p><strong>Humidity:</strong> ${data.main.humidity}%</p>
    `;
}
function displayPhotos(photoArray) {
    photosGrid.innerHTML = '';
    if (photoArray.length === 0) {
        photosGrid.innerHTML = '<p>No photos found for this destination.</p>';
        return;
    }
    photoArray.forEach(photo => {
        const img = document.createElement('img');
        img.src = photo.urls.small;
        img.alt = photo.alt_description;
        photosGrid.appendChild(img);
    });
}

function initializeMap(lat, lon, destinationName) {
    if (map) { 
        map.setView([lat, lon], 13);
    } else { 
        map = L.map('map').setView([lat, lon], 13);
        L.tileLayer('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key={apiKey}', {
            apiKey: MAPTILER_API_KEY,
            attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
        }).addTo(map);
    }
    L.marker([lat, lon]).addTo(map)
        .bindPopup(`<b>${destinationName}</b>`)
        .openPopup();
}

function saveToHistory(destination) {
    let history = JSON.parse(localStorage.getItem('travelHistory')) || [];
    const lowerCaseDestination = destination.toLowerCase();
   
    if (!history.includes(lowerCaseDestination)) {
        history.unshift(lowerCaseDestination); 
        history = history.slice(0, 5); 
        localStorage.setItem('travelHistory', JSON.stringify(history));
    }
    loadHistory();
}

function loadHistory() {
    let history = JSON.parse(localStorage.getItem('travelHistory')) || [];
    historyList.innerHTML = '';
    history.forEach(city => {
        const li = document.createElement('li');
        li.textContent = city;
        li.style.textTransform = 'capitalize';
        li.addEventListener('click', () => {
            destinationInput.value = city;
            fetchData(city);
        });
        historyList.appendChild(li);
    });
}
