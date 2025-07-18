let map;
let mapboxToken = "";
let isMapReady = false;

// Fetch token from backend and initialize map
fetch('/api/token')
  .then(res => res.json())
  .then(data => {
    mapboxToken = data.token;
    mapboxgl.accessToken = mapboxToken;

    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [78.9629, 20.5937], // Center on India
      zoom: 4
    });

    map.on('load', () => {
      isMapReady = true;
      console.log("Map loaded and ready!");
    });
  })
  .catch(err => {
    console.error("Error loading Mapbox token:", err);
    alert("Failed to load map. Try refreshing.");
  });

// Fetch coordinates for a location
async function getCoordinates(location) {
  const response = await fetch(`/api/geocode?location=${encodeURIComponent(location)}`);
  const data = await response.json();
  return [data.longitude, data.latitude];
}

// Fetch route from Mapbox Directions API
async function getRoute(start, end) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&overview=full&access_token=${mapboxToken}`;
  const response = await fetch(url);
  const json = await response.json();

  if (!json.routes || json.routes.length === 0) throw new Error("No route found.");

  const route = json.routes[0];
  const geometry = route.geometry;
  const duration = route.duration; // in seconds

  return { geometry, duration };
}

// Approximate distance between coordinates
function totalDistanceKm(coords) {
  let dist = 0;
  for (let i = 1; i < coords.length; i++) {
    dist += haversine(coords[i - 1], coords[i]);
  }
  return dist;
}

function haversine(coord1, coord2) {
  const R = 6371; // Radius of Earth in km
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * Math.PI / 180;
}

// Identify nearby city/town name
async function getPlaceName(lon, lat) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?types=place&access_token=${mapboxToken}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.features[0]?.place_name || "Unknown town";
}

// Handle form submit
async function submitLocations(e) {
  e.preventDefault();

  if (!isMapReady) {
    alert("Map is not ready yet. Please wait...");
    return;
  }

  const from = document.getElementById("from").value;
  const to = document.getElementById("to").value;

  if (!from || !to) {
    alert("Please enter both start and destination.");
    return;
  }

  try {
    const fromCoords = await getCoordinates(from);
    const toCoords = await getCoordinates(to);

    // Add markers
    new mapboxgl.Marker({ color: 'green' }).setLngLat(fromCoords).addTo(map);
    new mapboxgl.Marker({ color: 'red' }).setLngLat(toCoords).addTo(map);

    // Get route
    const { geometry, duration } = await getRoute(fromCoords, toCoords);

    // Fit map to route
    const bounds = new mapboxgl.LngLatBounds();
    geometry.coordinates.forEach(coord => bounds.extend(coord));
    map.fitBounds(bounds, { padding: 60 });

    // Draw route line
    const route = {
      type: 'Feature',
      geometry: geometry
    };

    if (map.getSource('route')) {
      map.getSource('route').setData(route);
    } else {
      map.addSource('route', {
        type: 'geojson',
        data: route
      });

      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#007cbf',
          'line-width': 5
        }
      });
    }

    // City/Town Markers with ETA
    const coords = geometry.coordinates;
    const totalPoints = coords.length;
    const step = Math.floor(totalPoints / 6); // pick ~6 towns
    const now = new Date();

    for (let i = step; i < coords.length; i += step) {
      const [lon, lat] = coords[i];
      const fraction = i / totalPoints;
      const eta = new Date(now.getTime() + duration * 1000 * fraction);
      const place = await getPlaceName(lon, lat);

      new mapboxgl.Marker({ color: '#0066ff', scale: 0.5 })
        .setLngLat([lon, lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>${place}</strong><br>ETA: ${eta.toLocaleTimeString()}`))
        .addTo(map);
    }

    // Clear instructions
    document.getElementById("waypoints").innerHTML = "";

  } catch (err) {
    console.error("Route error:", err);
    alert("Failed to get route. Try again.");
  }
}
