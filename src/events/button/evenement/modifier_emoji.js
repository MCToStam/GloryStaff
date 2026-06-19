const {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const Evenement = require("../../../../util/database/models/Evenement");

module.exports = {
  data: { name: "evenement_modifieremoji" },

  async execute(client, interaction, config) {
    const evenementId = interaction.customId.split("-")[1];

    const evenement = await Evenement.findById(evenementId).lean();

    const modal = new ModalBuilder()
      .setCustomId(`evenement_modifieremoji-${evenementId}`)
      .setTitle("✏️ Modifier l'Émoji");

    const nouvelEmoji = new TextInputBuilder()
      .setCustomId("evenement_nouvelemoji")
      .setLabel("Nouvel émoji")
      .setStyle(TextInputStyle.Paragraph)
      .setValue(evenement?.emoji || "")
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(nouvelEmoji));

    return interaction.showModal(modal);
  },
};
