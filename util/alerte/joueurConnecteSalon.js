const config = require("../../config");
const getServerPlayer = require("../module/getServerPlayer");
const { getData } = require("../module/getAndSaveData");

async function joueurConnecteSalon(client) {
  for (const server of config.liste_serveur) {
    try {
      const joueurConnecteConfigData = getData(
        `data/${server}/config-joueurconnecte.json`,
      );

      if (
        joueurConnecteConfigData &&
        joueurConnecteConfigData["joueurconnecte"].active &&
        joueurConnecteConfigData["joueurconnecte"].Salon.valeur &&
        joueurConnecteConfigData["joueurconnecte"]["Texte Affiché"].questions[0]
          .valeur
      ) {
        const data = await getServerPlayer(server);
        const nbJoueur = data.nombre;

        const channel = await client.channels.fetch(
          joueurConnecteConfigData["joueurconnecte"].Salon.valeur,
        );

        const texte = joueurConnecteConfigData["joueurconnecte"][
          "Texte Affiché"
        ].questions[0].valeur.replace("{nombre}", String(nbJoueur));

        await channel.setName(texte).catch(console.error);
      }
    } catch (e) {
      console.log("[ERREUR JOUEUR CONNECTE SALON]", e);
    }
  }
}

module.exports = { joueurConnecteSalon };
