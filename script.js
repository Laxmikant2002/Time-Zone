// Replace with your Geoapify API Key
const API_KEY = '8d70c7a02a5443e3856e82c14f25c78a';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    getCurrentTimezone();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const submitBtn = document.getElementById('submit-btn');
    const addressInput = document.getElementById('address-input');

    submitBtn.addEventListener('click', handleAddressSubmit);
    
    // Allow Enter key to submit
    addressInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddressSubmit();
        }
    });
}

// Get current timezone using Geolocation API
function getCurrentTimezone() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                await fetchTimezoneData(lat, lon, 'current');
            },
            (error) => {
                console.error('Geolocation error:', error);
                displayError('current', 'Unable to retrieve your location. Please enable location services.');
            }
        );
    } else {
        displayError('current', 'Geolocation is not supported by your browser.');
    }
}

// Fetch timezone data using reverse geocoding
async function fetchTimezoneData(lat, lon, type) {
    try {
        const response = await fetch(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const properties = data.features[0].properties;
            
            // Extract timezone information
            const timezoneData = {
                name: properties.timezone?.name || 'N/A',
                offsetSTD: properties.timezone?.offset_STD || 'N/A',
                offsetSTDSeconds: properties.timezone?.offset_STD_seconds !== undefined ? properties.timezone.offset_STD_seconds : 'N/A',
                offsetDST: properties.timezone?.offset_DST || 'N/A',
                offsetDSTSeconds: properties.timezone?.offset_DST_seconds !== undefined ? properties.timezone.offset_DST_seconds : 'N/A',
                country: properties.country || 'N/A',
                postcode: properties.postcode || 'N/A',
                city: properties.city || properties.town || properties.village || properties.county || 'N/A',
                lat: lat.toFixed(6),
                lon: lon.toFixed(6)
            };

            displayTimezoneData(type, timezoneData);
        } else {
            throw new Error('No data found for the given coordinates');
        }
    } catch (error) {
        console.error('Error fetching timezone data:', error);
        displayError(type, 'Error fetching timezone data. Please try again.');
    }
}

// Display timezone data in the UI
function displayTimezoneData(type, data) {
    const prefix = type === 'current' ? 'current' : 'result';

    document.getElementById(`${prefix}-timezone-name`).textContent = data.name;
    document.getElementById(`${prefix}-lat`).textContent = data.lat;
    document.getElementById(`${prefix}-long`).textContent = data.lon;
    document.getElementById(`${prefix}-offset-std`).textContent = data.offsetSTD;
    document.getElementById(`${prefix}-offset-std-seconds`).textContent = data.offsetSTDSeconds;
    document.getElementById(`${prefix}-offset-dst`).textContent = data.offsetDST;
    document.getElementById(`${prefix}-offset-dst-seconds`).textContent = data.offsetDSTSeconds;
    document.getElementById(`${prefix}-country`).textContent = data.country;
    document.getElementById(`${prefix}-postcode`).textContent = data.postcode;
    document.getElementById(`${prefix}-city`).textContent = data.city;

    // Clear error message if displaying result
    if (type === 'result') {
        clearError();
    }
}

// Display error in the current timezone section
function displayError(type, message) {
    const prefix = type === 'current' ? 'current' : 'result';
    
    document.getElementById(`${prefix}-timezone-name`).textContent = message;
    document.getElementById(`${prefix}-lat`).textContent = '-';
    document.getElementById(`${prefix}-long`).textContent = '-';
    document.getElementById(`${prefix}-offset-std`).textContent = '-';
    document.getElementById(`${prefix}-offset-std-seconds`).textContent = '-';
    document.getElementById(`${prefix}-offset-dst`).textContent = '-';
    document.getElementById(`${prefix}-offset-dst-seconds`).textContent = '-';
    document.getElementById(`${prefix}-country`).textContent = '-';
    document.getElementById(`${prefix}-postcode`).textContent = '-';
    document.getElementById(`${prefix}-city`).textContent = '-';
}

// Handle address submission
async function handleAddressSubmit() {
    const addressInput = document.getElementById('address-input');
    const address = addressInput.value.trim();

    // Validate input
    if (!address) {
        showError('Please enter an address');
        return;
    }

    clearError();
    
    // Show loading state
    document.getElementById('result-timezone-name').textContent = 'Loading...';

    try {
        // Geocode the address to get coordinates
        const response = await fetch(
            `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const coordinates = data.features[0].geometry.coordinates;
            const lon = coordinates[0];
            const lat = coordinates[1];

            // Fetch timezone data using the coordinates
            await fetchTimezoneData(lat, lon, 'result');
        } else {
            showError('Address not found. Please enter a valid address.');
            displayError('result', 'No results found');
        }
    } catch (error) {
        console.error('Error processing address:', error);
        showError('Error processing address. Please try again.');
        displayError('result', 'Error occurred');
    }
}

// Show error message
function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Clear error message
function clearError() {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = '';
    errorElement.style.display = 'none';
}