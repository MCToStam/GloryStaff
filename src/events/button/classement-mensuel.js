const { EmbedBuilder } = require("discord.js");
const { getFiles, getData } = require("../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "classement_mensuel",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const [_, type, id] = interaction.customId.split("-");
    const isNotation = type === "notation";

    const files = getFiles("data/classement/mois");

    const matchingFile = files.find(
      (file) => file.startsWith(`classement-${id}-`) && file.endsWith(".json")
    );

    const classementData = getData(`data/classement/mois/${matchingFile}`);

    const embedColor = interaction.message.embeds[0]?.color;

    const serveur = Object.keys(config.couleur).find(
      (key) => config.couleur[key] === embedColor
    );

    try {
      let classementTexte;

      if (isNotation) {
        classementTexte = classementData
          .sort((a, b) => b.moyenneNotation - a.moyenneNotation)
          .map(
            (entry, index) =>
              `#${index + 1} <:NG${entry.serveur
                .charAt(0)
                .toUpperCase()}${entry.serveur.slice(1)}:${
                config.emoji[entry.serveur.toLowerCase()]
              }> **${entry.serveur
                .charAt(0)
                .toUpperCase()}${entry.serveur.slice(1)}** : ${Math.round(
                entry.moyenneNotation
              ).toLocaleString()}$ ( Total : ${Math.round(
                entry.argentNotation
              ).toLocaleString()}$ )`
          )
          .join("\n");
      } else {
        classementTexte = classementData
          .sort((a, b) => b.moyenneConnexion - a.moyenneConnexion)
          .map(
            (entry, index) =>
              `#${index + 1} <:NG${entry.serveur
                .charAt(0)
                .toUpperCase()}${entry.serveur.slice(1)}:${
                config.emoji[entry.serveur.toLowerCase()]
              }> **${entry.serveur
                .charAt(0)
                .toUpperCase()}${entry.serveur.slice(
                1
              )}** : ${entry.moyenneConnexion.toFixed(0)} joueurs`
          )
          .join("\n");
      }

      const embed = new EmbedBuilder()
        .setTitle(
          `Classement Mensuel - ${isNotation ? "Notations" : "Connexions"}`
        )
        .setColor(config.couleur[serveur])
        .setDescription(classementTexte)
        .setFooter({ text: config.footer });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error("Erreur dans classement mensuel :", error);
      return interaction.reply({
        content: "Une erreur est survenue lors du classement mensuel.",
        ephemeral: true,
      });
    }
  },
};
