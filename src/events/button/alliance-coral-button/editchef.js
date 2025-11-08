const {
  ModalBuilder,
  UserSelectMenuBuilder,
  LabelBuilder,
} = require("discord.js");
const { getData } = require("../../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "ally_editchef",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const data = getData("data/coral/alliance/donnee.json");
    const allianceNom = interaction.customId.replace("ally_editchef-", "");
    const alliance = data.find((a) => a.nom === allianceNom);

    const modal = new ModalBuilder()
      .setCustomId(`modal_ally_editchef-${allianceNom}`)
      .setTitle(`Modifier le chef de ${allianceNom}`);

    const chef1 = new LabelBuilder()
      .setLabel("Sélectionne un Utilisateur")
      .setDescription("Chef 1 de l'alliance ( optionnel )")
      .setUserSelectMenuComponent(
        new UserSelectMenuBuilder()
          .setCustomId("chef1")
          .setPlaceholder("Sélectionne un utilisateur...")
          .setRequired(false)
          .setMaxValues(1)
          .setDefaultUsers(alliance.chef[0] ? [alliance.chef[0]] : []),
      );

    const chef2 = new LabelBuilder()
      .setLabel("Sélectionne un Utilisateur")
      .setDescription("Chef 2 de l'alliance ( optionnel )")
      .setUserSelectMenuComponent(
        new UserSelectMenuBuilder()
          .setCustomId("chef2")
          .setPlaceholder("Sélectionne un utilisateur...")
          .setRequired(false)
          .setMaxValues(1)
          .setDefaultUsers(alliance.chef[1] ? [alliance.chef[1]] : []),
      );

    modal.addLabelComponents(chef1, chef2);

    return interaction.showModal(modal);
  },
};
