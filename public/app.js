// app.js

// Initialize the Leaflet map
const map = L.map('map').setView([20.59, 78.96], 5); // Centered over India

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

// Placeholder for future functionality (form submission, routing, etc.)
document.getElementById('route-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const origin = document.getElementById('origin').value;
  const destination = document.getElementById('destination').value;
  const departureTime = document.getElementById('departure-time').value;

  console.log('Form submitted:', { origin, destination, departureTime });

  // Phase 3 will add routing logic here
});
