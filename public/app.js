// app.js

// === 1. Map Initialization ===
const map = L.map('map').setView([20.59, 78.96], 5); // India center

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

// === 2. Click Map to Set Origin and Destination ===
let clickCount = 0;
let fromMarker, toMarker;

map.on('click', function (e) {
  const { lat, lng } = e.latlng;
  const formatted = `${lat.toFixed(5)},${lng.toFixed(5)}`;

  if (clickCount === 0) {
    if (fromMarker) map.removeLayer(fromMarker);
    fromMarker = L.marker(e.latlng, { title: 'Start' }).addTo(map);
    document.getElementById('origin').value = formatted;
    clickCount = 1;
  } else {
    if (toMarker) map.removeLayer(toMarker);
    toMarker = L.marker(e.latlng, { title: 'Destination' }).addTo(map);
    document.getElementById('destination').value = formatted;
    clickCount = 0;
  }
});

// === 3. Geocode Address (Step 3b) ===
async function geocodeAddress(query, type) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
  );
  const data = await response.json();
  if (data && data.length > 0) {
    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);
    const formatted = `${lat.toFixed(5)},${lon.toFixed(5)}`;

    const marker = L.marker([lat, lon], {
      title: type === 'origin' ? 'Start' : 'Destination',
    }).addTo(map);

    if (type === 'origin') {
      if (fromMarker) map.removeLayer(fromMarker);
      fromMarker = marker;
      document.getElementById('origin').value = formatted;
    } else {
      if (toMarker) map.removeLayer(toMarker);
      toMarker = marker;
      document.getElementById('destination').value = formatted;
    }

    map.setView([lat, lon], 10);
  } else {
    alert('Location not found. Try a different address.');
  }
}

// Handle address button clicks
document.getElementById('origin-search-btn').addEventListener('click', () => {
  const query = document.getElementById('origin-search').value;
  geocodeAddress(query, 'origin');
});

document.getElementById('destination-search-btn').addEventListener('click', () => {
  const query = document.getElementById('destination-search').value;
  geocodeAddress(query, 'destination');
});

// === 4. Handle Route Form Submit (for later steps) ===
document.getElementById('route-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const origin = document.getElementById('origin').value;
  const destination = document.getElementById('destination').value;
  const departureTime = document.getElementById('departure-time').value;

  console.log('Form submitted:', { origin, destination, departureTime });

  // Step 4: Route logic will be added here.
});
