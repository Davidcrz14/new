const express = require("express");
const session = require("express-session");
const passport = require("passport");
const SpotifyStrategy = require("passport-spotify").Strategy;
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Array para almacenar usuarios en memoria
let users = [];

// Configuración de Passport
passport.use(
  new SpotifyStrategy(
    {
      clientID:
        process.env.SPOTIFY_CLIENT_ID || "708b8752d1fe4454bf79955f90007e63",
      clientSecret:
        process.env.SPOTIFY_CLIENT_SECRET || "eb014f8e8fab4bb28b3400943efe67cb",
      callbackURL: "https://new-dk65.onrender.com/auth/spotify/callback",
    },
    async (accessToken, refreshToken, expires_in, profile, done) => {
      try {
        let user = users.find((u) => u.spotifyId === profile.id);
        if (!user) {
          user = {
            id: users.length + 1,
            spotifyId: profile.id,
            name: profile.displayName,
            lat: Math.random() * 180 - 90,
            lng: Math.random() * 360 - 180,
            currentTrack: "No track playing",
            accessToken: accessToken,
          };
          users.push(user);
        } else {
          user.accessToken = accessToken;
        }
        done(null, user);
      } catch (error) {
        console.error("Error en la estrategia de Spotify:", error);
        done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = users.find((u) => u.id === id);
  done(null, user);
});

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "tu_secreto",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(
  cors({
    origin: "https://new-dk65.onrender.com",
    credentials: true,
  })
);

// Rutas
app.get(
  "/auth/spotify",
  passport.authenticate("spotify", {
    scope: [
      "user-read-email",
      "user-read-private",
      "user-read-currently-playing",
    ],
  })
);

app.get(
  "/auth/spotify/callback",
  passport.authenticate("spotify", { failureRedirect: "/error" }),
  (req, res) => {
    res.redirect("/");
  }
);

// Nueva ruta para obtener la canción actual
app.get("/api/current-track", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const response = await axios.get(
        "https://api.spotify.com/v1/me/player/currently-playing",
        {
          headers: {
            Authorization: `Bearer ${req.user.accessToken}`,
          },
        }
      );
      if (response.data && response.data.item) {
        const trackName = response.data.item.name;
        const artistName = response.data.item.artists[0].name;
        req.user.currentTrack = `${trackName} - ${artistName}`;
        res.json({ currentTrack: req.user.currentTrack });
      } else {
        res.json({ currentTrack: "No track playing" });
      }
    } catch (error) {
      console.error("Error al obtener la canción actual:", error);
      res.status(500).json({ error: "Error al obtener la canción actual" });
    }
  } else {
    res.status(401).json({ error: "Usuario no autenticado" });
  }
});

app.get("/api/users", (req, res) => {
  res.json(users);
});

// Nueva ruta para verificar el estado de autenticación
app.get("/api/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      name: req.user.name,
      currentTrack: req.user.currentTrack,
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Añade manejo de errores global
app.use((err, req, res, next) => {
  console.error("Error no manejado:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

// Modifica el listener del servidor
const server = app.listen(port, () =>
  console.log(`Servidor corriendo en http://localhost:${port}`)
);

server.on("error", (error) => {
  console.error("Error en el servidor:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Excepción no capturada:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Rechazo no manejado en:", promise, "razón:", reason);
});
