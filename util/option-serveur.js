const config = require("../config");

const serveurs = config.liste_serveur.map((s) => ({
  name: config.serveur[s].nom,
  value: s,
}));

const serveurs_java = config.liste_serveur_java.map((s) => ({
  name: config.serveur[s].nom,
  value: s,
}));

const serveurs_bedrock = config.liste_serveur_bedrock.map((s) => ({
  name: config.serveur[s].nom,
  value: s,
}));

module.exports = {
  serveurs,
  serveurs_java,
  serveurs_bedrock,
};
