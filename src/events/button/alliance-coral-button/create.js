const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
  LabelBuilder,
} = require("discord.js");

module.exports = {
  data: {
    name: "alliance_create",
  },

  async execute(client, interaction, config) {
    const modal = new ModalBuilder()
      .setCustomId("modal_alliance_create")
      .setTitle("Créer une alliance");

    const nomInput = new LabelBuilder()
      .setLabel("Nom de l'Alliance")
      .setDescription("Le nom de l'alliance à attribuer")
      .setTextInputComponent(
        new TextInputBuilder()
          .setCustomId("nom")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Entrer le nom...")
          .setRequired(true)
          .setMaxLength(100),
      );

    const chef1 = new LabelBuilder()
      .setLabel("Sélectionne un Utilisateur")
      .setDescription("Chef 1 de l'alliance ( optionnel )")
      .setUserSelectMenuComponent(
        new UserSelectMenuBuilder()
          .setCustomId("chef1")
          .setPlaceholder("Sélectionne un utilisateur...")
          .setRequired(false)
          .setMaxValues(1),
      );

    const chef2 = new LabelBuilder()
      .setLabel("Sélectionne un Utilisateur")
      .setDescription("Chef 2 de l'alliance ( optionnel )")
      .setUserSelectMenuComponent(
        new UserSelectMenuBuilder()
          .setCustomId("chef2")
          .setPlaceholder("Sélectionne un utilisateur...")
          .setRequired(false)
          .setMaxValues(1),
      );

    modal.addLabelComponents(nomInput, chef1, chef2);

    return interaction.showModal(modal);
  },
};
