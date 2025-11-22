const {
  getFiles,
  getData,
  getImage,
  saveData,
} = require("../util/module/getAndSaveData");
require("dotenv").config();

async function updateLogo(client, config) {
  const token = process.env.DISCORD_TOKEN;
  const cache = getData("data/logo/serveur.json");
  const guildsToKeep = new Set();

  for (const serveur of config.liste_serveur) {
    try {
      const files = getFiles(`data/${serveur}`);

      const channelIds = [];

      for (const file of files) {
        if (!file.startsWith("config-") || !file.endsWith(".json")) continue;

        const data = getData(`data/${serveur}/${file}`);

        for (const key in data) {
          const entry = data[key];
          for (const param in entry) {
            const paramValue = entry[param];
            if (
              paramValue &&
              typeof paramValue === "object" &&
              paramValue.type === "channel"
            ) {
              const valeur = paramValue.valeur;
              if (Array.isArray(valeur)) {
                for (const salon of valeur) {
                  channelIds.push(salon);
                }
              } else if (typeof valeur === "string") {
                channelIds.push(valeur);
              }
            }
          }
        }
      }

      const imageBase64 =
        "data:image/png;base64," +
        getImage(`data/logo/${serveur}.png`).toString("base64");

      const guildIds = new Set();
      for (const channelId of channelIds) {
        if (!channelId) continue;
        const channel = await client.channels
          .fetch(channelId)
          .catch(() => null);
        if (channel?.guild) guildIds.add(channel.guild.id);
      }

      for (const guildId of guildIds) {
        guildsToKeep.add(guildId);

        if (cache[guildId] === serveur) continue;

        const res = await fetch(
          `https://discord.com/api/v10/guilds/${guildId}/members/@me`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bot ${token}`,
              "Content-Type": "application/json",
              "X-Audit-Log-Reason": `Mise à jour automatique du logo ${serveur}`,
            },
            body: JSON.stringify({ avatar: imageBase64 }),
          },
        );

        if (!res.ok) {
          const err = await res.text();
          console.error(`Erreur update logo ${serveur} → ${guildId}:`, err);
          continue;
        }

        cache[guildId] = serveur;
        saveData("data/logo/serveur.json", cache);
      }
    } catch (err) {
      console.error(`Erreur traitement du serveur ${serveur}:`, err);
    }
  }

  const allGuilds = await client.guilds.fetch();

  for (const [guildId] of allGuilds) {
    if (guildId === config.support_serveur_id) {
      if (cache[guildId]) {
        try {
          const res = await fetch(
            `https://discord.com/api/v10/guilds/${guildId}/members/@me`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bot ${token}`,
                "Content-Type": "application/json",
                "X-Audit-Log-Reason":
                  "Suppression de l'avatar pour le serveur de support",
              },
              body: JSON.stringify({ avatar: null }),
            },
          );

          if (!res.ok) {
            const err = await res.text();
            console.error(`Erreur suppression logo support → ${guildId}:`, err);
            continue;
          }

          delete cache[guildId];
          saveData("data/logo/serveur.json", cache);
          await new Promise((r) => setTimeout(r, 1500));
        } catch (err) {
          console.error(`Erreur suppression logo support → ${guildId}:`, err);
        }
      }
      continue;
    }

    if (!guildsToKeep.has(guildId) && cache[guildId]) {
      try {
        const res = await fetch(
          `https://discord.com/api/v10/guilds/${guildId}/members/@me`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bot ${token}`,
              "Content-Type": "application/json",
              "X-Audit-Log-Reason": "Suppression de l'avatar",
            },
            body: JSON.stringify({ avatar: null }),
          },
        );

        if (!res.ok) {
          const err = await res.text();
          console.error(`Erreur suppression logo → ${guildId}:`, err);
          continue;
        }

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
