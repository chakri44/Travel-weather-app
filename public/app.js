let map;
let mapboxToken = "";
let isMapReady = false;

// Initialize map after fetching token
fetch('/api/token')
  .then(res => res.json())
  .then(data => {
    mapboxToken = data.token;
    mapboxgl.accessToken = mapboxToken;

    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [78.9629, 20.5937],
      zoom: 4
    });

    map.on('load', () => {
      isMapReady = true;
      console.log("Map loaded.");
    });
  })
  .catch(err => {
    console.error("Mapbox token load error:", err);
    alert("Failed to load map.");
  });

// Get coordinates from location name
async function getCoordinates(location) {
  const res = await fetch(`/api/geocode?location=${encodeURIComponent(location)}`);
  const data = await res.json();
  return [data.longitude, data.latitude];
}

// Get route geometry and duration
async function getRoute(start, end) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&overview=full&access_token=${mapboxToken}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!json.routes?.length) throw new Error("No route found.");
  return { geometry: json.routes[0].geometry, duration: json.routes[0].duration };
}

// Get place name by coordinates
async function getPlaceName(lon, lat) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?types=place&access_token=${mapboxToken}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.features[0]?.place_name || "Unknown location";
}

// Fetch weather from server
async function getWeather(lat, lon) {
  try {
    const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error("Weather API error");
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn("Weather fetch failed:", err);
    return null;
  }
}

// Haversine (for optional future distance logic)
function toRad(deg) { return deg * Math.PI / 180; }
function haversine(coord1, coord2) {
  const R = 6371;
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 🔁 UPDATED: Submit handler
async function submitLocations(e) {
  e.preventDefault();
  if (!isMapReady) return alert("Map not ready yet.");

  const from = document.getElementById("from").value;
  const to = document.getElementById("to").value;
  if (!from || !to) return alert("Enter both locations.");

  try {
    const fromCoords = await getCoordinates(from);
    const toCoords = await getCoordinates(to);

    const fromName = await getPlaceName(fromCoords[0], fromCoords[1]);

    const fromPopup = new mapboxgl.Popup().setHTML(`<strong>Start:</strong><br>${fromName}`);
    new mapboxgl.Marker({ color: 'green' })
      .setLngLat(fromCoords)
      .setPopup(fromPopup)
      .addTo(map)
      .togglePopup();

    const { geometry, duration } = await getRoute(fromCoords, toCoords);
    const coords = geometry.coordinates;

    // Fit map to route
    const bounds = new mapboxgl.LngLatBounds();
    coords.forEach(coord => bounds.extend(coord));
    map.fitBounds(bounds, { padding: 60 });

    // Draw route
    const route = { type: 'Feature', geometry };
    if (map.getSource('route')) {
      map.getSource('route').setData(route);
    } else {
      map.addSource('route', { type: 'geojson', data: route });
      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#007cbf', 'line-width': 5 }
      });
    }

    // Weather markers
    const step = Math.floor(coords.length / 6);
    const now = new Date();

    for (let i = step; i < coords.length; i += step) {
      const [lon, lat] = coords[i];
      const eta = new Date(now.getTime() + duration * 1000 * (i / coords.length));
      const place = await getPlaceName(lon, lat);
      const weather = await getWeather(lat, lon);

      let popupHTML = `<strong>${place}</strong><br>ETA: ${eta.toLocaleTimeString()}`;

      if (weather && weather.temperature !== undefined) {
        popupHTML += `
          <br><img src="${weather.icon}" style="width:30px;height:30px;" alt="${weather.condition}">
          <br>${weather.temperature}°C, ${weather.condition}`;
      } else {
        popupHTML += `<br>Weather: unavailable`;
      }

      new mapboxgl.Marker({ color: '#0066ff', scale: 0.5 })
        .setLngLat([lon, lat])
        .setPopup(new mapboxgl.Popup().setHTML(popupHTML))
        .addTo(map);
    }

    // Destination marker
    const toName = await getPlaceName(toCoords[0], toCoords[1]);
    const destPopup = new mapboxgl.Popup().setHTML(`<strong>Destination:</strong><br>${toName}`);
    new mapboxgl.Marker({ color: 'red' })
      .setLngLat(toCoords)
      .setPopup(destPopup)
      .addTo(map);

    // Clear any previous route instructions
    document.getElementById("waypoints").innerHTML = "";

  } catch (err) {
    console.error("Route error:", err);
    alert("Failed to fetch route or data.");
  }
}
