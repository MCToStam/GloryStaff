const express = require("express");
const log = require("./util/module/log");
const bodyParser = require("body-parser");
const fs = require("node:fs");
const path = require("node:path");
require("./util/attentestaff");
const config = require("./config");

const app = express();
const port = 21319;

app.use(bodyParser.json());

const rateLimits = new Map();

function rateLimit({ windowMs, max }) {
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    if (!rateLimits.has(ip)) {
      rateLimits.set(ip, []);
    }

    const requests = rateLimits.get(ip).filter((time) => now - time < windowMs);

    if (requests.length >= max) {
      return res.status(429).json({
        error: "Trop de requêtes, veuillez réessayer plus tard.",
      });
    }

    requests.push(now);
    rateLimits.set(ip, requests);

    next();
  };
}

const tempsDeJeuLimiter = rateLimit({
  windowMs: 23 * 60 * 60 * 1000,
  max: 1,
});

app.post("/tempsdejeu", tempsDeJeuLimiter, (req, res) => {
  const { date, serveurs } = req.body;

  if (!date || !serveurs) {
    return res.status(400).json({ error: "Payload invalide" });
  }

  for (const [serveur, joueurs] of Object.entries(serveurs)) {
    if (!config.liste_serveur.includes(serveur)) continue;

    const staffDir = path.join(__dirname, "data", serveur, "staff");
    const serveurDir = path.join(
      __dirname,
      "data",
      serveur,
      "tempsdejeu",
      `${date}.json`,
    );
    fs.writeFileSync(serveurDir, JSON.stringify(joueurs, null, 2), "utf8");

    if (!fs.existsSync(staffDir)) {
      console.warn(
        `Dossier staff introuvable pour le serveur ${serveur}, on passe`,
      );
      continue;
    }

    for (const [pseudo, temps] of Object.entries(joueurs)) {
      const joueurFilePath = path.join(staffDir, `${pseudo}.json`);

      if (!fs.existsSync(joueurFilePath)) {
        continue;
      }

      try {
        const joueurData = JSON.parse(fs.readFileSync(joueurFilePath, "utf8"));

        if (!joueurData["temps-de-jeu"]) {
          joueurData["temps-de-jeu"] = {};
        }

        joueurData["temps-de-jeu"][date] = temps;

        fs.writeFileSync(
          joueurFilePath,
          JSON.stringify(joueurData, null, 2),
          "utf8",
        );
      } catch (err) {
        console.error(`Erreur sur ${pseudo} du serveur ${serveur}:`, err);
      }
    }
  }

  log("✅ Temps de jeu ajouté pour tous les serveurs", "LOG", "gray");

  res
    .status(200)
    .json({ message: "Données de temps de jeu traitées avec succès." });
});

app.listen(port, () => {
  log(`Serveur API démarré sur le port ${port}`, "READY", "green");
});
