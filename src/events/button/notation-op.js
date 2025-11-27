const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  LabelBuilder,
} = require("discord.js");

module.exports = {
  data: {
    name: "notation_op",
  },

  async execute(client, interaction, config) {
    const id = interaction.customId.slice("notation_op-".length);
    const modal = new ModalBuilder()
      .setCustomId(`qui_note_pays-${id}`)
      .setTitle("Affiche l'opérateur qui note ton pays");

    const input = new LabelBuilder()
      .setLabel("Nom de ton Pays")
      .setDescription("Quelle est le nom de ton pays ?")
      .setTextInputComponent(
        new TextInputBuilder()
          .setCustomId("nom-pays")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("France, Allemagne, Espagne, IleVictoria ...")
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(50),
      );

    modal.addLabelComponents(input);

    await interaction.showModal(modal);
  },
};
