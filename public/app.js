// Initialize the map
const map = L.map("map").setView([0, 0], 2);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Function to authenticate with Spotify
function authenticateWithSpotify() {
  window.location.href = "/auth/spotify";
}

// Function to get user information
async function getUserInfo() {
  try {
    const response = await axios.get("/api/user");
    const userData = response.data;

    if (userData.authenticated) {
      document.getElementById(
        "user-name"
      ).textContent = `Nombre: ${userData.name}`;
      document.getElementById("current-track").textContent = `Canción actual: ${
        userData.currentTrack || "No hay canción reproduciéndose"
      }`;
      document.getElementById("auth-button").style.display = "none";
    } else {
      document.getElementById("auth-button").style.display = "block";
      document.getElementById("user-name").textContent = "No autenticado";
      document.getElementById("current-track").textContent = "";
    }
  } catch (error) {
    console.error("Error al obtener la información del usuario:", error);
    document.getElementById("user-name").textContent =
      "Error al obtener información del usuario";
    document.getElementById("current-track").textContent = "";
    document.getElementById("auth-button").style.display = "block";
  }
}

// Function to get user's location
function getUserLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        document.getElementById(
          "user-location"
        ).textContent = `Ubicación: ${lat.toFixed(2)}, ${lon.toFixed(2)}`;

        // Add a marker to the map
        L.marker([lat, lon]).addTo(map).bindPopup("Tu ubicación").openPopup();

        // Center the map on the user's location
        map.setView([lat, lon], 13);
      },
      function (error) {
        console.error("Error getting location:", error);
        document.getElementById("user-location").textContent =
          "No se pudo obtener la ubicación";
      }
    );
  } else {
    document.getElementById("user-location").textContent =
      "Geolocalización no soportada";
  }
}

// Function to handle authentication errors
function checkForAuthError() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("auth_error")) {
    const errorMessage =
      urlParams.get("error_description") ||
      "Error en la autenticación de Spotify";
    document.getElementById("user-name").textContent = errorMessage;
    document.getElementById("auth-button").style.display = "block";
  }
}

// Call functions when the page loads
window.onload = function () {
  getUserInfo();
  getUserLocation();
  checkForAuthError();
};

// Refresh user info every 30 seconds
setInterval(getUserInfo, 30000);
