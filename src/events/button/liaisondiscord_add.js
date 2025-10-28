const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  data: {
    name: "gestionstaff_liaisondiscord_add",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const modal = new ModalBuilder()
      .setCustomId("liaisondiscord_set_modal")
      .setTitle("Créé une liaison Discord d'un staff");

    const idInput = new TextInputBuilder()
      .setCustomId("liaisondiscord-id")
      .setLabel("ID de la personne")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Entrez l'ID Discord de la personne")
      .setRequired(true);

    const idRow = new ActionRowBuilder().addComponents(idInput);

    modal.addComponents(idRow);

    await interaction.showModal(modal);
  },
};
