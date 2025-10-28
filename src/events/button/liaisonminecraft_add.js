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
      .setCustomId("liaisonminecraft_set_modal")
      .setTitle("Créé une liaison Minecraft d'un staff");

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
