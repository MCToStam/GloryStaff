const {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const Evenement = require("../../../../util/database/models/Evenement");

module.exports = {
  data: { name: "evenement_modifiercreateur" },

  async execute(client, interaction, config) {
    const evenementId = interaction.customId.split("-")[1];

    const evenement = await Evenement.findById(evenementId).lean();

    const modal = new ModalBuilder()
      .setCustomId(`evenement_modifiercreateur-${evenementId}`)
      .setTitle("✏️ Modifier les Créateurs");

    const createurs = new TextInputBuilder()
      .setCustomId("evenement_createurs")
      .setLabel("Pseudonymes séparés par une virgule")
      .setStyle(TextInputStyle.Paragraph)
      .setValue(evenement?.createur?.join(", ") || "")
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(createurs));

    return interaction.showModal(modal);
  },
};
