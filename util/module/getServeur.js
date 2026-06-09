const config = require("../../config");

async function getServeur(interaction) {
  const color =
    interaction.message.components[0].data.accent_color ||
    interaction.message.components[1].data.accent_color;

  const serveur = Object.entries(config.serveur).find(([, data]) => {
    const hexValue = data.couleur;
    const decimalValue =
      typeof hexValue === "string" ? parseInt(hexValue, 16) : hexValue;

    return decimalValue === color;
  })?.[0];

  return serveur;
}

module.exports = { getServeur };
