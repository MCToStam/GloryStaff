const {
  getData,
  getImage,
  saveData,
} = require("../util/module/getAndSaveData");
require("dotenv").config({ quiet: true });
const config = require("../config");

async function updateLogo(client) {
  const token = process.env.DISCORD_TOKEN;
  const cache = getData("data/logo/serveur.json") || {};

  const guildServers = new Map();

  for (const serveur of config.liste_serveur) {
    try {
      const configData = getData(`data/${serveur}/config.json`);
      if (!Array.isArray(configData)) continue;

      for (const module of configData) {
        if (!module.systeme) continue;

        for (const systemeKey in module.systeme) {
          const active = module.systeme[systemeKey]?.active;
          if (!active || typeof active !== "object") continue;

          for (const guildId of Object.keys(active)) {
            if (!guildId) continue;

            if (!guildServers.has(guildId)) {
              guildServers.set(guildId, new Set());
            }

            guildServers.get(guildId).add(serveur);
          }
        }
      }
    } catch (err) {
      console.error(`Erreur lecture config ${serveur}:`, err);
    }
  }

  for (const [guildId, serveurs] of guildServers) {
    if (guildId === config.support_serveur_id) continue;

    if (serveurs.size !== 1) continue;

    const [serveur] = [...serveurs];

    if (cache[guildId] === serveur) continue;

    try {
      const imageBase64 =
        "data:image/png;base64," +
        getImage(`data/logo/${serveur}.png`).toString("base64");

      const res = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/@me`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bot ${token}`,
            "Content-Type": "application/json",
            "X-Audit-Log-Reason": `Logo automatique ${serveur}`,
          },
          body: JSON.stringify({ avatar: imageBase64 }),
        },
      );

      if (!res.ok) {
        console.error(
          `Erreur update logo ${serveur} → ${guildId}:`,
          await res.text(),
        );
        continue;
      }

      cache[guildId] = serveur;
      saveData("data/logo/serveur.json", cache);
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.error(`Erreur update logo → ${guildId}:`, err);
    }
  }

  const allGuilds = await client.guilds.fetch();

  for (const [guildId] of allGuilds) {
    const serveurs = guildServers.get(guildId);

    const mustRemove =
      guildId === config.support_serveur_id || !serveurs || serveurs.size !== 1;

    if (mustRemove && cache[guildId]) {
      try {
        await fetch(
          `https://discord.com/api/v10/guilds/${guildId}/members/@me`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bot ${token}`,
              "Content-Type": "application/json",
              "X-Audit-Log-Reason": "Suppression automatique du logo",
            },
            body: JSON.stringify({ avatar: null }),
          },
        );

        delete cache[guildId];
        saveData("data/logo/serveur.json", cache);
        await new Promise((r) => setTimeout(r, 1500));
      } catch (err) {
        console.error(`Erreur suppression logo → ${guildId}:`, err);
      }
    }
  }
}

module.exports = { updateLogo };
