const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  data: {
    name: "notation_op",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const id = interaction.customId.slice("notation_op-".length);
    const modal = new ModalBuilder()
      .setCustomId(`qui_note_pays-${id}`)
      .setTitle("Affiche l'OP qui note ton pays");

    const paysInput = new TextInputBuilder()
      .setCustomId("nom-pays")
      .setLabel("Quelle est le nom de ton pays ?")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("France, Allemagne, Espagne, IleVictoria ...")
      .setRequired(true);

    const paysRow = new ActionRowBuilder().addComponents(paysInput);

    modal.addComponents(paysRow);

    await interaction.showModal(modal);
  },
};
