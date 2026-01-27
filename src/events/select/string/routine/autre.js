const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  data: {
    name: "routine_autre",
  },

  async execute(client, interaction, config) {
    const modal = new ModalBuilder()
      .setCustomId("routine_autre")
      .setTitle("Ajouter une infraction à la routine");

    const detailsInput = new TextInputBuilder()
      .setCustomId("routine_details")
      .setLabel("Détails à apporter")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Entrez les détails à apporter")
      .setRequired(true);

    const pseudoRow = new ActionRowBuilder().addComponents(detailsInput);

    modal.addComponents(pseudoRow);

    await interaction.showModal(modal);
  },
};
