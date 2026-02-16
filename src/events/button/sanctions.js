const { ModalBuilder, FileUploadBuilder, LabelBuilder } = require("discord.js");

module.exports = {
  data: {
    name: "sanctions",
  },

  async execute(client, interaction, config) {
    const type = interaction.customId.split("-")[1];
    const typeMap = {
      chat: "Tchat",
      vocal: "Vocal",
      game: "En Jeu",
    };

    const modal = new ModalBuilder()
      .setCustomId(`sanctions-${type}`)
      .setTitle(`Modifie le Tableau des Sanctions ${typeMap[type]}`);

    const tableau = new LabelBuilder()
      .setLabel("Tableau des Sanctions")
      .setDescription(
        `Upload le tableau des sanctions ${typeMap[type].toLowerCase()}`,
      )
      .setFileUploadComponent(
        new FileUploadBuilder()
          .setCustomId("tableau")
          .setMinValues(1)
          .setMaxValues(1)
          .setRequired(true),
      );

    modal.addLabelComponents(tableau);

    await interaction.showModal(modal);
  },
};
