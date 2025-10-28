const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  data: {
    name: "ally_addfonda",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const allianceNom = interaction.customId.replace("ally_addfonda-", "");

    const modal = new ModalBuilder()
      .setCustomId(`modal_ally_addfonda-${allianceNom}`)
      .setTitle(`Ajouter un pays à ${allianceNom}`);

    const paysInput = new TextInputBuilder()
      .setCustomId("pays")
      .setLabel("Nom du pays à ajouter")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(paysInput));
    return interaction.showModal(modal);
  },
};
