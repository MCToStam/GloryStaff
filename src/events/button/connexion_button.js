const { EmbedBuilder } = require("discord.js");
const { getData } = require("../../../util/module/getAndSaveData");
const { generateConnexionEmbed } = require("../../../util/connexion");

module.exports = {
  data: {
    name: "config_toggle",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const [_, serveur, joueur, semaineOffsetStr] =
      interaction.customId.split("-");
    const semaineOffset = parseInt(semaineOffsetStr);

    const staffData = getData(`data/${serveur}/staff/${joueur}`);

    if (!staffData) {
      const embed = new EmbedBuilder()
        .setTitle(`Connexion - ${joueur}`)
        .setDescription("Aucune donnée trouvée pour ce joueur.")
        .setColor(config.errorcolor)
        .setFooter({ text: config.footer });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const tempsJeu = staffData["temps-de-jeu"] || {};

    const { embed, row, attachment } = await generateConnexionEmbed(
      serveur,
      joueur,
      tempsJeu,
      semaineOffset,
    );
    const files = attachment ? [attachment] : [];
    await interaction.update({
      embeds: [embed],
      components: [row],
      files,
      ephemeral: true,
    });
  },
};
