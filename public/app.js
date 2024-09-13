// Inicializar el mapa
const map = L.map("map").setView([0, 0], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

let markers = [];
let userMarker;

// Función para añadir marcadores al mapa
function addMarkers(users) {
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];
  users.forEach((user) => {
    if (user.lat && user.lng) {
      const marker = L.marker([user.lat, user.lng]).addTo(map);
      marker.bindPopup(
        `<b>${user.name}</b><br>Escuchando: ${user.currentTrack || "Nada"}`
      );
      markers.push(marker);
    }
  });
}

// Función para obtener datos de usuarios
async function fetchUserData() {
  try {
    const response = await axios.get(
      "https://new-dk65.onrender.com/api/users",
      { withCredentials: true }
    );
    if (response.data && Array.isArray(response.data)) {
      addMarkers(response.data);
    } else {
      console.error("Datos de usuarios inválidos:", response.data);
    }
  } catch (error) {
    console.error("Error al obtener datos de usuarios:", error);
  }
}

// Función para autenticar con Spotify
function authenticateWithSpotify() {
  window.location.href = "https://new-dk65.onrender.com/auth/spotify";
}

// Función para obtener la ubicación del usuario
function getUserLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (userMarker) {
          map.removeLayer(userMarker);
        }

        userMarker = L.marker([lat, lng]).addTo(map);
        userMarker.bindPopup("Tu ubicación").openPopup();

        map.setView([lat, lng], 13);

        document.getElementById(
          "user-location"
        ).textContent = `Ubicación: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        document.getElementById("user-info").classList.remove("hidden");
      },
      function (error) {
        console.error("Error obteniendo la ubicación:", error);
      }
    );
  } else {
    console.log("Geolocalización no disponible");
  }
}

// Función para verificar el estado de autenticación
async function checkAuthStatus() {
  try {
    const response = await axios.get("https://new-dk65.onrender.com/api/user", {
      withCredentials: true,
    });
    if (response.data.authenticated) {
      document.getElementById("auth-button").classList.add("hidden");
      document.getElementById("user-name").textContent = `Usuario: ${
        response.data.name || "Desconocido"
      }`;
      document.getElementById("current-track").textContent = `Escuchando: ${
        response.data.currentTrack || "Nada"
      }`;
      document.getElementById("user-info").classList.remove("hidden");
      fetchUserData();
      getCurrentTrack();
      setInterval(getCurrentTrack, 10000);
    }
  } catch (error) {
    console.error("Error al verificar el estado de autenticación:", error);
  }
}

// Función para obtener la canción actual
async function getCurrentTrack() {
  try {
    const response = await axios.get(
      "https://new-dk65.onrender.com/api/current-track",
      { withCredentials: true }
    );
    document.getElementById("current-track").textContent = `Escuchando: ${
      response.data.currentTrack || "Nada"
    }`;
  } catch (error) {
    console.error("Error al obtener la canción actual:", error);
  }
}

// Inicializar la aplicación
checkAuthStatus();
getUserLocation();

// Actualizar datos cada 30 segundos
setInterval(fetchUserData, 30000);
