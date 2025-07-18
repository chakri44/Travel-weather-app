// Initialize the map at a default location (India)
const map = L.map('map').setView([20.5937, 78.9629], 5);

// Add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
}).addTo(map);

// Dummy event handler for route planning
document.getElementById('route-form').addEventListener('submit', function (e) {
  e.preventDefault();
  
  const origin = document.getElementById('origin').value;
  const destination = document.getElementById('destination').value;
  const departureTime = document.getElementById('departure-time').value;

  // Just showing a dummy result for now
  const results = document.getElementById('results');
  results.innerHTML = `
    <h2>Planned Route</h2>
    <p><strong>From:</strong> ${origin}</p>
    <p><strong>To:</strong> ${destination}</p>
    <p><strong>Departure:</strong> ${new Date(departureTime).toLocaleString()}</p>
  `;

  // Add a marker to the map (static demo)
  L.marker([20.5937, 78.9629])
    .addTo(map)
    .bindPopup(`Route planned: ${origin} → ${destination}`)
    .openPopup();
});
