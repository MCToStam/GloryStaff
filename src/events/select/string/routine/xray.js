const {
  EmbedBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  data: {
    name: "routine_xray",
  },

  async execute(client, interaction, config) {
    const modal = new ModalBuilder()
      .setCustomId("routine_xray")
      .setTitle("Ajouter une infraction à la routine");

    const pseudoInput = new TextInputBuilder()
      .setCustomId("routine_pseudo")
      .setLabel("Pseudonyme de la personne concernée")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Entrez le pseudonyme de la personne concernée")
      .setRequired(true);

    const pseudoRow = new ActionRowBuilder().addComponents(pseudoInput);

    modal.addComponents(pseudoRow);

    await interaction.showModal(modal);
  },
};
