const config = require("../../config");
const getServerPlayer = require("../module/getServerPlayer");
const { getData } = require("../module/getAndSaveData");

async function joueurConnecteSalon(client) {
  for (const serveur of config.liste_serveur) {
    try {
      const dataConfig = getData(`data/${serveur}/config.json`);
      const configData = dataConfig.find(
        (c) => c.nom === "Joueur(s) Connecté(s)",
      );

      const jcConfig = configData.systeme.joueurconnecte;

      if (!Object.values(jcConfig.active || {}).some((value) => value === true))
        continue;

      const data = await getServerPlayer(serveur);
      const nbJoueur = data.nombre;

      for (const [guildId, isActive] of Object.entries(jcConfig.active || {})) {
        if (!isActive) continue;

        const channelId = jcConfig.Salon?.valeur?.[guildId];
        if (!channelId) continue;

        try {
          const channel = await client.channels.fetch(channelId);
          if (!channel) continue;

          const texteTemplate =
            jcConfig["Texte Affiché"]?.questions?.[0]?.valeur?.[guildId];
          if (!texteTemplate) continue;
          const texte = texteTemplate.replace("{nombre}", String(nbJoueur));

          await channel.setName(texte);
        } catch (err) {
          console.error(
            `❌ Erreur salon joueur connecté | serveur ${serveur} | guild ${guildId}`,
            err,
          );
        }
      }
    } catch (e) {
      console.error("[ERREUR JOUEUR CONNECTE SALON]", serveur);
    }
  }
}

module.exports = { joueurConnecteSalon };
