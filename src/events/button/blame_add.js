const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  data: {
    name: "gestionstaff_blame_add",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const modal = new ModalBuilder()
      .setCustomId("blame_add_modal")
      .setTitle(`Ajoute un blâme à un staff`);

    const raisonInput = new TextInputBuilder()
      .setCustomId("blame-raison")
      .setLabel("Raison du Blâme")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Entrez la raison du blâme")
      .setRequired(true);

    const raisonRow = new ActionRowBuilder().addComponents(raisonInput);

    modal.addComponents(raisonRow);

    await interaction.showModal(modal);
  },
};
