const { ModalBuilder, LabelBuilder, FileUploadBuilder } = require("discord.js");
const Evenement = require("../../../../util/database/models/Evenement");

const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg"];
const EXTENSION_PAR_MIME = {
  "image/png": "png",
  "image/jpeg": "jpg",
};

module.exports = {
  data: { name: "evenement_modifierimage" },

  async execute(client, interaction, config) {
    const evenementId = interaction.customId.split("-")[1];

    const modal = new ModalBuilder()
      .setCustomId(`evenement_modifierimage-${evenementId}`)
      .setTitle("✏️ Modifier l'Image");

    const image = new LabelBuilder()
      .setLabel("Image de l'événement")
      .setDescription("Upload l'image à afficher pour cet événement")
      .setFileUploadComponent(
        new FileUploadBuilder()
          .setCustomId("evenement_image")
          .setMinValues(1)
          .setMaxValues(1)
          .setRequired(true),
      );

    modal.addLabelComponents(image);

    return interaction.showModal(modal);
  },
};
