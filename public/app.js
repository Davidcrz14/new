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
  const userInfoElement = document.getElementById("user-info");
  const authButton = document.getElementById("auth-button");

  if (userData.authenticated) {
    userInfoElement.innerHTML = `
      <div class="card bg-base-100 shadow-xl">
        <figure class="px-10 pt-10">
          <img src="${
            userData.profileImage
          }" alt="Foto de perfil" class="rounded-full w-24 h-24">
        </figure>
        <div class="card-body items-center text-center">
          <h2 class="card-title">${userData.name}</h2>
          <p>País: ${userData.country}</p>
          <p>Seguidores: ${userData.followers}</p>
          <p>Escuchando: ${
            userData.currentTrack || "No hay canción reproduciéndose"
          }</p>
          <div class="card-actions">
            <a href="${
              userData.profileUrl
            }" target="_blank" class="btn btn-primary">Ver perfil en Spotify</a>
          </div>
        </div>
      </div>
    `;
    authButton.style.display = "none";
  } else {
    userInfoElement.innerHTML = `
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-primary">No autenticado</h2>
          <p>Conéctate a Spotify para ver tu información</p>
        </div>
      </div>
    `;
    authButton.style.display = "block";
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
