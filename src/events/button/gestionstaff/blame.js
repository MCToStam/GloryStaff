const {
  ModalBuilder,
  LabelBuilder,
  TextInputBuilder,
  TextInputStyle,
  ContainerBuilder,
  MessageFlags,
} = require("discord.js");
const { getData } = require("../../../../util/module/getAndSaveData");
const { getServeur } = require("../../../../util/module/getServeur");
const { discordLink } = require("../../../../util/module/discordLink");

module.exports = {
  data: {
    name: "gestionstaff_blame",
  },

  async execute(client, interaction, config) {
    const joueur = interaction.customId.split("-")[1];
    const serveur = await getServeur(interaction);
    const pseudo = await discordLink(interaction.user.id);
    const staffData = getData(`data/${serveur}/staff/${joueur}.json`);

    if (pseudo === joueur) {
      const container = new ContainerBuilder()
        .setAccentColor(config.serveur[serveur].couleur)
        .addTextDisplayComponents((t) =>
          t.setContent(`## 💢 Blâme - ${joueur.replace(/_/g, "\\_")}`),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `Tu n'as pas la permission de modifier tes propres blâmes, mais tu veux les visualiser.\n\n**Blâme n°1 :** ${staffData["Blâme 1"] || ""}\n**Blâme n°2 :** ${staffData["Blâme 2"] || ""}\n**Blâme n°3 :** ${staffData["Blâme 3"] || ""}`,
          ),
        );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

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
