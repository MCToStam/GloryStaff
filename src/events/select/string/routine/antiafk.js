const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  data: {
    name: "routine_antiafk",
  },

  async execute(client, interaction, config) {
    const modal = new ModalBuilder()
      .setCustomId("routine_antiafk")
      .setTitle("Ajouter une infraction à la routine");

    const pseudoInput = new TextInputBuilder()
      .setCustomId("routine_pseudo")
      .setLabel("Pseudonyme de la personne concernée")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Entrez le pseudonyme de la personne concernée")
      .setRequired(true);

    const tempsInput = new TextInputBuilder()
      .setCustomId("routine_temps")
      .setLabel("Temps de l'ATM (optionnel)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Entrez le temps d'ATM du joueur")
      .setRequired(false);

    const pseudoRow = new ActionRowBuilder().addComponents(pseudoInput);
    const tempsRow = new ActionRowBuilder().addComponents(tempsInput);

    modal.addComponents(pseudoRow, tempsRow);

    await interaction.showModal(modal);
  },
};
