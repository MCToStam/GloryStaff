const config = require("../../config");

async function getServeur(interaction) {
  const color = interaction.message.components[0].data.accent_color;

  const serveur = Object.keys(config.couleur).find((key) => {
    const hexValue = config.couleur[key];
    const decimalValue =
      typeof hexValue === "string" ? parseInt(hexValue, 16) : hexValue;
    return decimalValue === color;
  });

  return serveur;
}

module.exports = { getServeur };
