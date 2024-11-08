require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const app = express();
const port = process.env.PORT || 5501;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// MySQL Connection
const dbhost = process.env.MYSQL_HOST;
const dbport = process.env.MYSQL_PORT;
const dbuser = process.env.MYSQL_USER;
const dbpassword = process.env.MYSQL_PASSWORD;
const dbdatabase = process.env.MYSQL_DATABASE;

const db = mysql.createConnection({
  host: dbhost,
  port: dbport,
  user: dbuser, // your MySQL username
  password: dbpassword, // your MySQL password
  database: dbdatabase,
});

/*const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root", // your MySQL username
  password: "MJIDATABASE", // your MySQL password
  database: "aqi_data",
});*/

// Connect to MySQL
db.connect((err) => {
  if (err) throw err;
  console.log("MySQL Connected...");
});

// Define API Key and Locations
const API_KEY = process.env.API_KEY;
//const API_KEY = "1615adaa703ba9f96a337d48232ad32d";
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

      // Prepare SQL insert statement with an additional location column
      const insertQuery = `
        INSERT INTO sensor_data (location_name, timestamp, aqi, CO, ozone, NO2, SO2, dust)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // Insert data into MySQL
      db.query(
        insertQuery,
        [location.name, timestamp, aqi, CO, ozone, NO2, SO2, dust],
        (err) => {
          if (err) {
            console.error(`Error inserting data for ${location.name}:`, err);
          } else {
            console.log(
              `Air pollution data for ${location.name} inserted successfully.`
            );
          }
        }
      );
    } catch (error) {
      console.error(`Error fetching data for ${location.name}:`, error);
    }
  }
}

// Schedule data fetching every 5 minutes (300,000 ms)
setInterval(fetchAndStoreAirPollutionData, 300000); // 1 min = 60000 ms

// Endpoint to get sensor data for a specific location
app.get("/sensor_data/:location", (req, res) => {
  const location = req.params.location;
  const query =
    "SELECT * FROM sensor_data WHERE location_name = ? ORDER BY timestamp DESC";
  db.query(query, [location], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: "Error retrieving data" });
    } else {
      res.json(results); // Send data as JSON
      console.log(`Data sent to client for ${location}`);
    }
  });
});

// Endpoint to get all sensor data
app.get("/sensor_data", (req, res) => {
  const query = "SELECT * FROM sensor_data ORDER BY timestamp DESC";
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: "Error retrieving data" });
    } else {
      res.json(results); // Send data as JSON
      console.log("All data sent to client");
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
