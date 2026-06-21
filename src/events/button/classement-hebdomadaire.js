const { EmbedBuilder } = require("discord.js");
const { getFiles, getData } = require("../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "classement_hebdomadaire",
  },

  async execute(client, interaction, config) {
    const [, type, id] = interaction.customId.split("-");
    const isNotation = type === "notation";
    const isConnexion = type === "connexion";

    const files = getFiles("data/classement/semaine");

    const matchingFile = files.find(
      (file) => file.startsWith(`classement-${id}-`) && file.endsWith(".json"),
    );

    const classementData = getData(`data/classement/semaine/${matchingFile}`);

    const embedColor = interaction.message.embeds[0]?.color;
    const serveur = Object.keys(config.couleur).find(
      (key) => config.couleur[key] === embedColor,
    );

    let classementText;

    if (isConnexion) {
      classementText = classementData
        .sort((a, b) => a.classementConnection - b.classementConnection)
        .map(
          (entry, index) =>
            `#${index + 1} ${config.serveur[serveur].emoji_formate} **${config.serveur[serveur].nom}** : ${entry.moyenneConnexion.toFixed(0)} joueurs`,
        )
        .join("\n");
    } else if (isNotation) {
      classementText = classementData
        .sort((a, b) => a.classementNotation - b.classementNotation)
        .map(
          (entry, index) =>
            `#${index + 1} ${config.serveur[serveur].emoji_formate} **${config.serveur[serveur].nom}** : ${entry.argentNotation.toLocaleString()}$`,
        )
        .join("\n");
    }

    const embed = new EmbedBuilder()
      .setTitle(`Classement - ${isNotation ? "Notations" : "Connexions"}`)
      .setColor(config.serveur[serveur].couleur)
      .setDescription(classementText);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
