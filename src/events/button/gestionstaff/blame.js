const {
  ModalBuilder,
  LabelBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const { getData } = require("../../../../util/module/getAndSaveData");
const { getServeur } = require("../../../../util/module/getServeur");

module.exports = {
  data: {
    name: "gestionstaff_blame",
  },

  conf: {
    type: "User",
  },

  async execute(client, interaction, config) {
    const joueur = interaction.customId.split("-")[1];
    const serveur = await getServeur(interaction);

    const staffData = getData(`data/${serveur}/staff/${joueur}.json`);

    const modal = new ModalBuilder()
      .setCustomId(`gestionstaff_blame-${joueur}`)
      .setTitle("Modifier les Blâme");

    const blame1 = new LabelBuilder()
      .setLabel("Blâme 1")
      .setDescription("Modifie le blâme 1")
      .setTextInputComponent(
        (() => {
          const component = new TextInputBuilder()
            .setCustomId("blame1")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Raison du blâme")
            .setRequired(false)
            .setMinLength(0)
            .setMaxLength(200);

          if (staffData["Blâme 1"]) component.setValue(staffData["Blâme 1"]);

          return component;
        })(),
      );

    const blame2 = new LabelBuilder()
      .setLabel("Blâme 2")
      .setDescription("Modifie le blâme 2")
      .setTextInputComponent(
        (() => {
          const component = new TextInputBuilder()
            .setCustomId("blame2")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Raison du blâme")
            .setRequired(false)
            .setMinLength(0)
            .setMaxLength(200);

          if (staffData["Blâme 2"]) component.setValue(staffData["Blâme 2"]);

          return component;
        })(),
      );

    const blame3 = new LabelBuilder()
      .setLabel("Blâme 3")
      .setDescription("Modifie le blâme 3")
      .setTextInputComponent(
        (() => {
          const component = new TextInputBuilder()
            .setCustomId("blame3")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Raison du blâme")
            .setRequired(false)
            .setMinLength(0)
            .setMaxLength(200);

          if (staffData["Blâme 3"]) component.setValue(staffData["Blâme 3"]);

          return component;
        })(),
      );

    modal.addLabelComponents(blame1, blame2, blame3);

    await interaction.showModal(modal);
  },
};
