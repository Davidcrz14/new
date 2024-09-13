// Initialize the map
const map = L.map("map").setView([0, 0], 2);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

let marker;

// Function to authenticate with Spotify
function authenticateWithSpotify() {
  window.location.href = "/auth/spotify";
}

// Function to update UI based on user data
function updateUserUI(userData) {
  const userNameElement = document.getElementById("user-name");
  const currentTrackElement = document.getElementById("current-track");
  const authButton = document.getElementById("auth-button");

  if (userData.authenticated) {
    userNameElement.textContent = `Hola, ${userData.name}!`;
    currentTrackElement.textContent = `Escuchando: ${
      userData.currentTrack || "No hay canción reproduciéndose"
    }`;
    authButton.style.display = "none";
  } else {
    authButton.style.display = "block";
    userNameElement.textContent = "No autenticado";
    currentTrackElement.textContent = "";
  }
}

// Function to get user information
async function getUserInfo() {
  try {
    const response = await axios.get("/api/user", { withCredentials: true });
    updateUserUI(response.data);
  } catch (error) {
    console.error("Error al obtener la información del usuario:", error);
    updateUserUI({ authenticated: false });
  }
}

// Function to get user's location
function getUserLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        updateLocationUI(lat, lon);
        addMarkerToMap(lat, lon);
        centerMapOnLocation(lat, lon);
      },
      function (error) {
        console.error("Error getting location:", error);
        updateLocationUI(null, null);
      }
    );
  } else {
    updateLocationUI(null, null);
  }
}

function updateLocationUI(lat, lon) {
  const locationElement = document.getElementById("user-location");
  if (lat !== null && lon !== null) {
    locationElement.textContent = `Ubicación: ${lat.toFixed(2)}, ${lon.toFixed(
      2
    )}`;
  } else {
    locationElement.textContent = "No se pudo obtener la ubicación";
  }
}

function addMarkerToMap(lat, lon) {
  if (marker) {
    map.removeLayer(marker);
  }
  marker = L.marker([lat, lon])
    .addTo(map)
    .bindPopup("Tu ubicación")
    .openPopup();
}

function centerMapOnLocation(lat, lon) {
  map.setView([lat, lon], 13);
}

// Function to handle authentication errors
function checkForAuthError() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("auth_error")) {
    const errorMessage =
      urlParams.get("error") || "Error en la autenticación de Spotify";
    updateUserUI({ authenticated: false });
    document.getElementById("user-name").textContent = `Error: ${errorMessage}`;
  }
}

// Call functions when the page loads
document.addEventListener("DOMContentLoaded", function () {
  getUserInfo();
  getUserLocation();
  checkForAuthError();
});

// Refresh user info every 30 seconds
setInterval(getUserInfo, 30000);
