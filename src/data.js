async function fetchSensorData() {
  const response = await fetch("https://mjismartair.onrender.com/sensor_data"); // Get all data
  const data = await response.json();

  // Create a map to track the latest entry for each location
  const latestDataMap = new Map();

  // Iterate through the data to find the latest entry for each location
  data.forEach((row) => {
    // Check if this location already has an entry in the map
    if (
      !latestDataMap.has(row.location_name) ||
      new Date(row.timestamp) >
        new Date(latestDataMap.get(row.location_name).timestamp)
    ) {
      latestDataMap.set(row.location_name, row);
    }
  });

  // Get the table body element
  const tableBody = document
    .getElementById("sensorDataTable")
    .getElementsByTagName("tbody")[0];

  // Clear any existing rows
  tableBody.innerHTML = "";

  // Display the latest data for each location
  latestDataMap.forEach((row) => {
    const utcDate = new Date(row.timestamp); // Create a Date object from the UTC timestamp
    const options = {
      timeZone: "Africa/Nairobi", // Set the time zone to East Africa Time
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false, // Use 24-hour format
    };

    const localDate = utcDate.toLocaleString("en-US", options); // Convert to local time string
    const newRow = tableBody.insertRow();

    // Add data cells for each column
    newRow.insertCell(0).textContent = row.location_name;
    newRow.insertCell(1).textContent = localDate;
    newRow.insertCell(2).textContent = row.aqi;
    newRow.insertCell(3).textContent = row.co;
    newRow.insertCell(4).textContent = row.ozone;
    newRow.insertCell(5).textContent = row.no2;
    newRow.insertCell(6).textContent = row.so2;
    newRow.insertCell(7).textContent = row.dust;
  });
}

// Call the function to load data when the page loads
fetchSensorData();
