const {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const Evenement = require("../../../../util/database/models/Evenement");

module.exports = {
  data: { name: "evenement_modifiernom" },

  async execute(client, interaction, config) {
    const evenementId = interaction.customId.split("-")[1];

    const evenement = await Evenement.findById(evenementId).lean();

    const modal = new ModalBuilder()
      .setCustomId(`evenement_modifiernom-${evenementId}`)
      .setTitle("✏️ Modifier le Nom");

    const nouveauNom = new TextInputBuilder()
      .setCustomId("evenement_nouveaunom")
      .setLabel("Nouveau nom de l'événement")
      .setStyle(TextInputStyle.Short)
      .setValue(evenement?.nom || "")
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(nouveauNom));

    return interaction.showModal(modal);
  },
};
