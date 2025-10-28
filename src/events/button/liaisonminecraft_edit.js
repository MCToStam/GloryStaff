const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  data: {
    name: "gestionstaff_liaisonminecraft_edit",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const modal = new ModalBuilder()
      .setCustomId("liaisonminecraft_set_modal")
      .setTitle("Modifier la liaison Minecraft d'un staff");

    const idInput = new TextInputBuilder()
      .setCustomId("liaisonminecraft-id")
      .setLabel("ID de la personne")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Entrez le pseudo Minecraft de la personne")
      .setRequired(true);

    const idRow = new ActionRowBuilder().addComponents(idInput);

    modal.addComponents(idRow);

    await interaction.showModal(modal);
  },
};
