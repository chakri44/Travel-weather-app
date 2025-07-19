const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Serve MAPBOX token securely
app.get('/api/token', (req, res) => {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Mapbox token not set in .env' });
  }
  res.json({ token });
});

// Geocoding API: Convert location to coordinates
app.get('/api/geocode', async (req, res) => {
  const { location } = req.query;

  if (!location) {
    return res.status(400).json({ error: 'Location parameter is missing' });
  }

  try {
    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json`,
      {
        params: {
          access_token: process.env.MAPBOX_TOKEN,
          limit: 1
        }
      }
    );

    const feature = response.data.features[0];
    if (!feature) {
      return res.status(404).json({ error: 'No results found for the location' });
    }

    const [longitude, latitude] = feature.center;
    res.json({ latitude, longitude });
  } catch (error) {
    console.error('Geocode Error:', error.message);
    res.status(500).json({ error: 'Error fetching coordinates' });
  }
});

// Weather API: Get current weather from coordinates
app.get('/api/weather', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing latitude or longitude' });
  }

  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat,
        lon,
        appid: process.env.OPENWEATHER_API_KEY, // ✅ Correct env var
        units: 'metric'
      }
    });

    const { main, weather } = response.data;
    if (!main || !weather || !weather[0]) {
      return res.status(500).json({ error: 'Incomplete weather data' });
    }

    const temperature = main.temp;
    const { description, icon } = weather[0];

    res.json({
      temperature,
      condition: description,
      icon: `https://openweathermap.org/img/wn/${icon}@2x.png`
    });
  } catch (error) {
    console.error('Weather API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

