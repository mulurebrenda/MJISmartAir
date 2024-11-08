async function fetchSensorData() {
  try {
    const response = await fetch("http://localhost:5501/sensor_data");
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    displayData(data);
  } catch (error) {
    console.error("Error fetching sensor data:", error);
  }
}

// Display the data in the HTML
function displayData(data) {
  const tableBody = document.getElementById("datatable-body");
    tableBody.innerHTML = ""; // Clear existing content
    
  // Create a map to track the latest entry for each location
  const latestDataMap = new Map();

  // Iterate through data to find the latest entry for each location
  data.forEach((row) => {
    if (
      !latestDataMap.has(row.location_name) ||
      new Date(row.timestamp) >
        new Date(latestDataMap.get(row.location_name).timestamp)
    ) {
      latestDataMap.set(row.location_name, row);
    }
  });

  // Display the latest entries in the table
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

    const tr = document.createElement("tr");
    //tr.classList.add("row"); // Add the "row" class to the div
    tr.innerHTML = `
      <td>${row.location_name}</td>
      <td>${localDate}</td>
      <td>${row.aqi}</td>
      <td>${row.CO}</td>
      <td>${row.ozone}</td>
      <td>${row.NO2}</td>
      <td>${row.SO2}</td>
      <td>${row.dust}</td>
    `;
    tableBody.appendChild(tr);
  });
}

// Call the function to fetch data when the page loads
fetchSensorData();