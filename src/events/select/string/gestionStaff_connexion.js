const { EmbedBuilder } = require("discord.js");
const { getData } = require("../../../../util/module/getAndSaveData");
const { generateConnexionEmbed } = require("../../../../util/connexion");

module.exports = {
  data: {
    name: "gestionstaff_connexion",
  },

  async execute(client, interaction, config) {
    const embedColor = interaction.message.embeds[0]?.color;

    const serveur = Object.keys(config.couleur).find(
      (key) => config.couleur[key] === embedColor
    );

    const joueur = interaction.message.embeds[0]?.title
      ?.split("- ")[1]
      ?.trim()
      .replace(/\\/g, "");

    const staffData = getData(`data/${serveur}/staff/${joueur}.json`)

    if (!staffData) {
      const embed = new EmbedBuilder()
        .setTitle(`Connexion - ${joueur}`)
        .setDescription("Aucune donnée trouvée pour ce joueur.")
        .setColor(config.errorcolor)
        .setFooter({ text: config.footer });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const tempsJeu = staffData["temps-de-jeu"] || {};
    let semaineOffset = 0;
    const today = new Date();
    if (today.getDay() === 1) {
      semaineOffset = -1;
    }

    const { embed, row, attachment } = await generateConnexionEmbed(
      serveur,
      joueur,
      tempsJeu,
      semaineOffset
    );
    const files = attachment ? [attachment] : [];
    await interaction.reply({
      embeds: [embed],
      components: [row],
      files,
      ephemeral: true,
    });
  },
};
