const { getImage } = require("../util/module/getAndSaveData");
const config = require("../config");
const ServeurDiscord = require("../util/database/models/ServeurDiscord");
const Configuration = require("../util/database/models/Configuration");

async function updateLogo(client) {
  const token = process.env.DISCORD_TOKEN;

  const cacheDocs = await ServeurDiscord.find({});
  const cache = new Map(cacheDocs.map((doc) => [doc.guildId, doc.serveur]));

  const guildServers = new Map();

  for (const serveur of config.liste_serveur) {
    const configs = await Configuration.find({
      serveur,
    });

    if (!configs.length) continue;

    for (const cfg of configs) {
      if (!cfg.active) continue;

      if (!guildServers.has(cfg.guildId)) {
        guildServers.set(cfg.guildId, new Set());
      }

      guildServers.get(cfg.guildId).add(serveur);
    }
  }

  for (const [guildId, serveurs] of guildServers) {
    if (guildId === config.support_serveur_id) continue;

    if (serveurs.size !== 1) continue;
    const [serveur] = [...serveurs];
    if (cache.get(guildId) === serveur) continue;

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

      await ServeurDiscord.updateOne(
        { guildId },
        { serveur },
        { upsert: true },
      );
      cache.set(guildId, serveur);

      await new Promise((r) => setTimeout(r, 5000));
    } catch (err) {
      console.error(`Erreur update logo → ${guildId}:`, err);
    }
  }

  for (const guildId of client.guilds.cache.keys()) {
    const serveurs = guildServers.get(guildId);

    const mustRemove =
      guildId === config.support_serveur_id || !serveurs || serveurs.size !== 1;

    if (mustRemove && cache.has(guildId)) {
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

        await ServeurDiscord.deleteOne({ guildId });
        cache.delete(guildId);

        await new Promise((r) => setTimeout(r, 1500));
      } catch (err) {
        console.error(`Erreur suppression logo → ${guildId}:`, err);
      }
    }
  }
}

module.exports = { updateLogo };
