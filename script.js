// Replace with your Geoapify API Key
const API_KEY = '566f0b1a94ab4444aacc2f73407083da';

// Store timezone names for clock updates
let currentTimezoneName = null;
let resultTimezoneName = null;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    getCurrentTimezone();
    setupEventListeners();
    startClockUpdates();
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
            async (error) => {
                console.error('Geolocation error:', error);
                
                // Provide helpful error messages based on error code
                let errorMessage = '';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied. Using browser timezone as fallback.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable. Using browser timezone as fallback.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out. Using browser timezone as fallback.';
                        break;
                    default:
                        errorMessage = 'Unable to retrieve location. Using browser timezone as fallback.';
                }
                
                console.log(errorMessage);
                
                // Fallback: Use browser's timezone
                useBrowserTimezone();
            }
        );
    } else {
        console.log('Geolocation is not supported by your browser. Using browser timezone.');
        useBrowserTimezone();
    }
}

// Fallback function to use browser's detected timezone
function useBrowserTimezone() {
    try {
        // Get browser's timezone
        const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Display timezone info without coordinates
        const timezoneData = {
            name: timezoneName,
            offsetSTD: 'N/A',
            offsetSTDSeconds: 'N/A',
            offsetDST: 'N/A',
            offsetDSTSeconds: 'N/A',
            abbreviationSTD: 'N/A',
            abbreviationDST: 'N/A',
            country: 'Detected from browser',
            postcode: 'N/A',
            city: 'N/A',
            lat: 'N/A',
            lon: 'N/A'
        };
        
        currentTimezoneName = timezoneName;
        displayTimezoneData('current', timezoneData);
        
    } catch (error) {
        console.error('Error detecting browser timezone:', error);
        displayError('current', 'Unable to detect timezone. Please enter an address below or enable location services.');
    }
}

// Fetch timezone data using reverse geocoding
async function fetchTimezoneData(lat, lon, type) {
    try {
        const response = await fetch(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&format=json&apiKey=${API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Check if results exist (API returns array in 'results' field when format=json)
        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            
            // Extract timezone information
            const timezoneData = {
                name: result.timezone?.name || 'N/A',
                offsetSTD: result.timezone?.offset_STD || 'N/A',
                offsetSTDSeconds: result.timezone?.offset_STD_seconds !== undefined ? result.timezone.offset_STD_seconds : 'N/A',
                offsetDST: result.timezone?.offset_DST || 'N/A',
                offsetDSTSeconds: result.timezone?.offset_DST_seconds !== undefined ? result.timezone.offset_DST_seconds : 'N/A',
                abbreviationSTD: result.timezone?.abbreviation_STD || 'N/A',
                abbreviationDST: result.timezone?.abbreviation_DST || 'N/A',
                country: result.country || 'N/A',
                postcode: result.postcode || 'N/A',
                city: result.city || result.town || result.village || result.county || 'N/A',
                lat: lat.toFixed(6),
                lon: lon.toFixed(6)
            };

            // Store timezone name for clock updates
            if (type === 'current') {
                currentTimezoneName = timezoneData.name;
            } else {
                resultTimezoneName = timezoneData.name;
            }

            displayTimezoneData(type, timezoneData);
        } else {
            throw new Error('No location found for the given coordinates');
        }
    } catch (error) {
        console.error('Error fetching timezone data:', error);
        displayError(type, `Error: ${error.message}. Please try again.`);
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
    document.getElementById(`${prefix}-abbreviation-std`).textContent = data.abbreviationSTD;
    document.getElementById(`${prefix}-abbreviation-dst`).textContent = data.abbreviationDST;
    document.getElementById(`${prefix}-country`).textContent = data.country;
    document.getElementById(`${prefix}-postcode`).textContent = data.postcode;
    document.getElementById(`${prefix}-city`).textContent = data.city;

    // Update local time immediately
    updateLocalTime(type, data.name);

    // Clear error message if displaying result
    if (type === 'result') {
        clearError();
    }
}

// Display error in the timezone section
function displayError(type, message) {
    const prefix = type === 'current' ? 'current' : 'result';
    
    document.getElementById(`${prefix}-local-time`).textContent = '-';
    document.getElementById(`${prefix}-timezone-name`).textContent = message;
    document.getElementById(`${prefix}-lat`).textContent = '-';
    document.getElementById(`${prefix}-long`).textContent = '-';
    document.getElementById(`${prefix}-offset-std`).textContent = '-';
    document.getElementById(`${prefix}-offset-std-seconds`).textContent = '-';
    document.getElementById(`${prefix}-offset-dst`).textContent = '-';
    document.getElementById(`${prefix}-offset-dst-seconds`).textContent = '-';
    document.getElementById(`${prefix}-abbreviation-std`).textContent = '-';
    document.getElementById(`${prefix}-abbreviation-dst`).textContent = '-';
    document.getElementById(`${prefix}-country`).textContent = '-';
    document.getElementById(`${prefix}-postcode`).textContent = '-';
    document.getElementById(`${prefix}-city`).textContent = '-';

    // Clear timezone name from storage
    if (type === 'current') {
        currentTimezoneName = null;
    } else {
        resultTimezoneName = null;
    }
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
    document.getElementById('result-local-time').textContent = 'Loading...';

    try {
        // Geocode the address to get coordinates
        const response = await fetch(
            `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&format=json&apiKey=${API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Check if results exist (using format=json returns 'results' array)
        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const lon = result.lon;
            const lat = result.lat;

            // Fetch timezone data using the coordinates
            await fetchTimezoneData(lat, lon, 'result');
        } else {
            showError('Address not found. Please enter a valid address.');
            displayError('result', 'No results found');
        }
    } catch (error) {
        console.error('Error processing address:', error);
        showError(`Error: ${error.message}. Please try again.`);
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

// Update local time for a specific timezone
function updateLocalTime(type, timezoneName) {
    const prefix = type === 'current' ? 'current' : 'result';
    const element = document.getElementById(`${prefix}-local-time`);

    if (!timezoneName || timezoneName === 'N/A') {
        element.textContent = '-';
        return;
    }

    try {
        const now = new Date();
        const localTime = now.toLocaleString("en-US", { 
            timeZone: timezoneName,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        element.textContent = localTime;
    } catch (error) {
        console.error('Error updating local time:', error);
        element.textContent = 'Invalid timezone';
    }
}

// Start updating clocks every second
function startClockUpdates() {
    setInterval(() => {
        if (currentTimezoneName) {
            updateLocalTime('current', currentTimezoneName);
        }
        if (resultTimezoneName) {
            updateLocalTime('result', resultTimezoneName);
        }
    }, 1000);
}