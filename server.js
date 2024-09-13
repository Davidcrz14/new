const express = require("express");
const session = require("express-session");
const passport = require("passport");
const SpotifyStrategy = require("passport-spotify").Strategy;
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Credenciales de Spotify (usar variables de entorno en producción)
const SPOTIFY_CLIENT_ID =
  process.env.SPOTIFY_CLIENT_ID || "695b999fb05f4ed397863b68a8afedd7";
const SPOTIFY_CLIENT_SECRET =
  process.env.SPOTIFY_CLIENT_SECRET || "0713f557c0204cb48dab7f9d6958a0b0";

// Array para almacenar usuarios en memoria (considerar una base de datos en producción)
let users = [];

// Configuración de Passport
passport.use(
  new SpotifyStrategy(
    {
      clientID: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
      callbackURL: "https://new-dk65.onrender.com/auth/spotify/callback",
    },
    (accessToken, refreshToken, expires_in, profile, done) => {
      console.log("Perfil de Spotify recibido:", profile.id);
      try {
        let user = users.find((u) => u.spotifyId === profile.id);
        if (!user) {
          user = {
            id: users.length + 1,
            spotifyId: profile.id,
            name: profile.displayName,
            accessToken: accessToken,
            refreshToken: refreshToken,
          };
          users.push(user);
        } else {
          user.accessToken = accessToken;
          user.refreshToken = refreshToken;
        }
        done(null, user);
      } catch (error) {
        console.error("Error en la estrategia de Spotify:", error);
        done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializando usuario:", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  console.log("Deserializando usuario:", id);
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
    showDialog: true, // Forzar el diálogo de autorización de Spotify
  })
);

app.get(
  "/auth/spotify/callback",
  (req, res, next) => {
    console.log("Callback de Spotify recibido");
    console.log("Query params:", req.query);
    next();
  },
  passport.authenticate("spotify", { failureRedirect: "/auth-error" }),
  (req, res) => {
    console.log("Autenticación exitosa");
    console.log("Usuario:", req.user);
    res.redirect("/");
  }
);

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

app.get("/auth-error", (req, res) => {
  res.status(403).json({
    error:
      "Error en la autenticación de Spotify. Es posible que el usuario no esté registrado en la aplicación.",
  });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error("Error no manejado:", err);
  res.status(500).json({
    error: "Error interno del servidor",
    details: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

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
