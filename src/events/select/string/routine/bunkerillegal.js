const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  data: {
    name: "routine_bunkerillegal",
  },

  async execute(client, interaction, config) {
    const modal = new ModalBuilder()
      .setCustomId("routine_bunkerillegal")
      .setTitle("Ajouter une infraction à la routine");

    const coordonneeInput = new TextInputBuilder()
      .setCustomId("routine_coordonne")
      .setLabel("Coordonnées du bunker illégal")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Entrez les coordonnées du bunker illégal")
      .setRequired(true);

    const pseudoInput = new TextInputBuilder()
      .setCustomId("routine_pseudo")
      .setLabel("Pseudonyme de la personne concernée")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Entrez le pseudonyme de la personne concernée")
      .setRequired(true);

    const coordonneRow = new ActionRowBuilder().addComponents(coordonneeInput);
    const pseudoRow = new ActionRowBuilder().addComponents(pseudoInput);

    modal.addComponents(coordonneRow, pseudoRow);

    await interaction.showModal(modal);
  },
};
