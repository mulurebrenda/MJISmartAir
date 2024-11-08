let apiKey = "1615adaa703ba9f96a337d48232ad32d";
const lat = -1.2864;
const lon = 36.8172;

//current weather
function showTemperature(response) {
    console.log(response);
}

window.onload = function () {
  let apiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
axios.get(apiUrl).then(showTemperature);
}
//http://api.openweathermap.org/data/2.5/air_pollution?lat=50&lon=50&appid={APIkey}