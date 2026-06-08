const config = require("../../config");
const getServerPlayer = require("../module/getServerPlayer");
const Configuration = require("../database/models/Configuration");

async function joueurConnecteSalon(client) {
  for (const serveur of config.liste_serveur) {
    try {
      const data = await getServerPlayer(serveur);
      const nbJoueur = data.nombre;

      const configs = await Configuration.find({
        serveur,
        categorie: "Joueur(s) Connecté(s)",
        systeme: "Joueur(s) Connecté(s)",
      });

      for (const jcConfig of configs) {
        if (!jcConfig.active) continue;

        const guild = client.guilds.cache.get(jcConfig.guildId);
        if (!guild) continue;

        const channelId = jcConfig.data.get("Salon");
        if (!channelId) continue;

        const channel = guild.channels.cache.get(channelId);
        if (!channel) continue;

        try {
          const texteTemplate = jcConfig.data.get("Texte Affiché")[0];
          if (!texteTemplate) continue;

          const texte = texteTemplate.replace("{nombre}", String(nbJoueur));

          await channel.setName(texte);
        } catch (err) {
          console.error(
            `❌ Erreur salon joueur connecté | serveur ${serveur} | guild ${jcConfig.guildId}`,
            err,
          );
        }
      }
    } catch (err) {
      console.error(`❌ Erreur serveur joueur connecté | ${serveur}`, err);
    }
  }
}

module.exports = { joueurConnecteSalon };
