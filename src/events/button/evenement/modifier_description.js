const {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const Evenement = require("../../../../util/database/models/Evenement");

module.exports = {
  data: { name: "evenement_modifierdescription" },

  async execute(client, interaction, config) {
    const evenementId = interaction.customId.split("-")[1];

    const evenement = await Evenement.findById(evenementId).lean();

    const modal = new ModalBuilder()
      .setCustomId(`evenement_modifierdescription-${evenementId}`)
      .setTitle("✏️ Modifier la Description");

    const nouvelleDescription = new TextInputBuilder()
      .setCustomId("evenement_nouvelledescription")
      .setLabel("Nouvelle description")
      .setStyle(TextInputStyle.Paragraph)
      .setValue(evenement?.description || "")
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nouvelleDescription),
    );

    return interaction.showModal(modal);
  },
};
