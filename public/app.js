// Initialize the map
const map = L.map('map').setView([20.59, 78.96], 5); // Center of India

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

let clickCount = 0;
let fromMarker, toMarker;
let originCoords = null, destinationCoords = null;

// Click-based point selection
map.on('click', function (e) {
  if (clickCount === 0) {
    if (fromMarker) map.removeLayer(fromMarker);
    fromMarker = L.marker(e.latlng, { title: 'Start' }).addTo(map);
    document.getElementById('origin').value = `${e.latlng.lat},${e.latlng.lng}`;
    originCoords = e.latlng;
    clickCount = 1;
  } else {
    if (toMarker) map.removeLayer(toMarker);
    toMarker = L.marker(e.latlng, { title: 'Destination' }).addTo(map);
    document.getElementById('destination').value = `${e.latlng.lat},${e.latlng.lng}`;
    destinationCoords = e.latlng;
    clickCount = 0;
  }
});

// Geocode address to lat/lng using Mapbox API
async function geocodeLocation(text) {
  const token = 'pk.eyJ1IjoiY2hha3JpNDQiLCJhIjoiY21kOGh4YzBwMDBlcTJucTFkYzRkYnNlbCJ9.gCsLJrdJOwTW8fEZYVjB8w';
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${token}`;

  const response = await fetch(url);
  const data = await response.json();
  if (data.features && data.features.length > 0) {
    return {
      lat: data.features[0].center[1],
      lng: data.features[0].center[0],
    };
  } else {
    alert('Location not found!');
    return null;
  }
}

// Get route between two points
async function getRoute(start, end) {
  const token = 'pk.eyJ1IjoiY2hha3JpNDQiLCJhIjoiY21kOGh4YzBwMDBlcTJucTFkYzRkYnNlbCJ9.gCsLJrdJOwTW8fEZYVjB8w';
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&access_token=${token}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry;
    } else {
      alert("No route found.");
      return null;
    }
  } catch (err) {
    console.error("Route fetch error:", err);
    alert("Failed to fetch route.");
    return null;
  }
}

// When user clicks "Get Route"
document.getElementById('searchRoute').addEventListener('click', async () => {
  const originInput = document.getElementById('origin').value;
  const destinationInput = document.getElementById('destination').value;

  let from = originCoords;
  let to = destinationCoords;

  if (!from && originInput && !originInput.includes(',')) {
    from = await geocodeLocation(originInput);
  }
  if (!to && destinationInput && !destinationInput.includes(',')) {
    to = await geocodeLocation(destinationInput);
  }

  if (from && to) {
    const geometry = await getRoute(from, to);
    if (geometry) {
      const routeLine = L.geoJSON(geometry, {
        style: {
          color: 'blue',
          weight: 4
        }
      }).addTo(map);

      map.fitBounds(routeLine.getBounds());
    }
  } else {
    alert("Please provide both origin and destination.");
  }
});
