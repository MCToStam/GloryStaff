const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  data: {
    name: "totalstaff_retrait_sm",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const modal = new ModalBuilder()
      .setCustomId("liaisonop_remove_modal")
      .setTitle("Retire un Super-Modérateur");

    const idInput = new TextInputBuilder()
      .setCustomId("liaisonop-id")
      .setLabel("ID de la personne")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Entrez l'ID Discord de la personne")
      .setRequired(true);

    const idRow = new ActionRowBuilder().addComponents(idInput);

    modal.addComponents(idRow);

    await interaction.showModal(modal);
  },
};
