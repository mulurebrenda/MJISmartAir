require("dotenv").config();
const express = require("express");
const { Client } = require("pg"); // Import PostgreSQL client
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const app = express();
const port = process.env.PORT || 5501;

app.use(cors({ origin: "https://mji-smart-air.netlify.app" }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// PostgreSQL Connection
const dbhost = process.env.DB_HOST;
const dbport = process.env.DB_PORT || 5432; // Default PostgreSQL port is 5432
const dbuser = process.env.DB_USER;
const dbpassword = process.env.DB_PASSWORD;
const dbdatabase = process.env.DB_DATABASE;

const client = new Client({
  host: dbhost,
  port: dbport,
  user: dbuser,
  password: dbpassword,
  database: dbdatabase,
});

// Connect to PostgreSQL
client.connect((err) => {
  if (err) throw err;
  console.log("PostgreSQL Connected...");
});

// Define API Key and Locations
const API_KEY = process.env.API_KEY;
const LOCATIONS = [
  { name: "Nyeri Town", lat: "-0.4279", lon: "36.9596" },
  { name: "Othaya", lat: "-0.5616", lon: "36.9415" },
  { name: "Karatina", lat: "-0.4864", lon: "37.1323" },
  { name: "Mukurweini", lat: "-0.6361", lon: "37.0491" },
  { name: "Kiganjo", lat: "-0.4476", lon: "37.0639" },
  { name: "Narumoru", lat: "-0.1700", lon: "37.0251" },
  { name: "Chaka", lat: "-0.2904", lon: "37.0125" },
  { name: "Mweiga", lat: "-0.3775", lon: "36.8685" },
  { name: "Kiamariga", lat: "-0.4051", lon: "36.9204" },
  { name: "Endarasha", lat: "-0.3399", lon: "36.8435" },
];

// Function to fetch data from the API and insert it into the database
async function fetchAndStoreAirPollutionData() {
  for (const location of LOCATIONS) {
    try {
      const response = await axios.get(
        `http://api.openweathermap.org/data/2.5/air_pollution`,
        {
          params: {
            lat: location.lat,
            lon: location.lon,
            appid: API_KEY,
          },
        }
      );

      // Parse the API response
      const airData = response.data.list[0]; // Get the most recent data point
      const timestamp = new Date();
      const aqi = airData.main?.aqi || null;
      const CO = airData.components?.co || null;
      const ozone = airData.components?.o3 || null;
      const NO2 = airData.components?.no2 || null;
      const SO2 = airData.components?.so2 || null;
      const dust = airData.components?.pm10 || null;

      // Prepare SQL insert statement for PostgreSQL
      const insertQuery = `
        INSERT INTO sensor_data (location_name, timestamp, aqi, CO, ozone, NO2, SO2, dust)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      // Insert data into PostgreSQL
      await client.query(insertQuery, [
        location.name,
        timestamp,
        aqi,
        CO,
        ozone,
        NO2,
        SO2,
        dust,
      ]);

      console.log(
        `Air pollution data for ${location.name} inserted successfully.`
      );
    } catch (error) {
      console.error(`Error fetching data for ${location.name}:`, error);
    }
  }
}

// Schedule data fetching every 1hr (3,600,000 ms)
setInterval(fetchAndStoreAirPollutionData, 3600000); 

// Endpoint to get sensor data for a specific location
app.get("/sensor_data/:location", (req, res) => {
  const location = req.params.location;
  const query =
    "SELECT * FROM sensor_data WHERE location_name = $1 ORDER BY timestamp DESC";
  client.query(query, [location], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: "Error retrieving data" });
    } else {
      res.json(results.rows); // PostgreSQL result rows
      console.log(`Data sent to client for ${location}`);
    }
  });
});

// Endpoint to get all sensor data
app.get("/sensor_data", (req, res) => {
  const query = "SELECT * FROM sensor_data ORDER BY timestamp DESC";
  client.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: "Error retrieving data" });
    } else {
      res.json(results.rows); // PostgreSQL result rows
      console.log("All data sent to client");
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
