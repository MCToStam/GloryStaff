const {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const Evenement = require("../../../../util/database/models/Evenement");

module.exports = {
  data: { name: "evenement_creer" },

  async execute(client, interaction, config) {
    const serveur = interaction.customId.split("-")[1];

    const modal = new ModalBuilder()
      .setCustomId(`evenement_creer-${serveur}`)
      .setTitle("➕ Créer un Événement");

    const nom = new TextInputBuilder()
      .setCustomId("evenement_nom")
      .setLabel("Nom de l'événement")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const description = new TextInputBuilder()
      .setCustomId("evenement_description")
      .setLabel("Description de l'événement")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nom),
      new ActionRowBuilder().addComponents(description),
    );

    return interaction.showModal(modal);
  },
};
