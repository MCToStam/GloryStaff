const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  data: {
    name: "ally_remfonda",
  },

  async execute(client, interaction, config) {
    const allianceNom = interaction.customId.replace("ally_remfonda-", "");

    const modal = new ModalBuilder()
      .setCustomId(`modal_ally_remfonda-${allianceNom}`)
      .setTitle(`Retirer un pays de ${allianceNom}`);

    const paysInput = new TextInputBuilder()
      .setCustomId("pays")
      .setLabel("Nom du pays à retirer")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(paysInput));
    return interaction.showModal(modal);
  },
};
