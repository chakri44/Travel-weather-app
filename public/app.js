document.getElementById('route-form').addEventListener('submit', function(e) { 
  e.preventDefault(); // Stop default form submission

  // Extract user input values from the form
  const origin = document.getElementById('origin').value;
  const destination = document.getElementById('destination').value;
  const time = document.getElementById('departure-time').value;

  // Display a placeholder message in the results section
  document.getElementById('results').textContent = 
    `Planning route from ${origin} to ${destination} at ${time}...`;

  // (future step) Here’s where you’ll integrate:
  // - Google Maps or Leaflet for routing
  // - Weather API to fetch weather info for origin/destination
});
