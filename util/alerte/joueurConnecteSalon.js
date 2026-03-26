const config = require("../../config");
const getServerPlayer = require("../module/getServerPlayer");
const { getData } = require("../module/getAndSaveData");

async function joueurConnecteSalon(client) {
  for (const serveur of config.liste_serveur) {
    const dataConfig = getData(`data/${serveur}/config.json`);
    const configData = dataConfig.find(
      (c) => c.nom === "Joueur(s) Connecté(s)",
    );

    const jcConfig = configData.systeme["Joueur(s) Connecté(s)"];

    if (!Object.values(jcConfig.active || {}).some((value) => value === true))
      continue;

    const data = await getServerPlayer(serveur);
    const nbJoueur = data.nombre;

    for (const [guildId, isActive] of Object.entries(jcConfig.active || {})) {
      if (!isActive) continue;

      const guild = client.guilds.cache.get(guildId);
      if (!guild) continue;

      const channelId = jcConfig.Salon?.valeur?.[guildId];
      if (!channelId) continue;

      const channel = guild.channels.cache.get(channelId).catch(() => null);
      if (!channel) continue;

      try {
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
  }
}

module.exports = { joueurConnecteSalon };
