const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  data: {
    name: "gestionstaff_datederank_edit",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const modal = new ModalBuilder()
      .setCustomId("datederank_edit_modal")
      .setTitle(`Modifier la liaison Discord d'un staff`);

    const dataInput = new TextInputBuilder()
      .setCustomId("datederank-data")
      .setLabel("Données à modifier")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Entrez l'intégralités des données à modifier")
      .setRequired(true);

    const dataRow = new ActionRowBuilder().addComponents(dataInput);

    modal.addComponents(dataRow);

    await interaction.showModal(modal);
  },
};
