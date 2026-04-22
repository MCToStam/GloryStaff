const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} = require("discord.js");
const { getServeur } = require("../../../../util/module/getServeur");

module.exports = {
  data: {
    name: "absence_add",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);
    const [, userId] = interaction.customId.split("-");

    const modal = new ModalBuilder()
      .setCustomId(`absence_add-${userId}-${serveur}`)
      .setTitle("➕ Ajouter une absence");

    const debut = new TextInputBuilder()
      .setCustomId("absence_debut")
      .setLabel("Date de début au format JJ/MM/AAA HH:MM")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const fin = new TextInputBuilder()
      .setCustomId("absence_fin")
      .setLabel("Date de fin au format JJ/MM/AAA HH:MM")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const raison = new TextInputBuilder()
      .setCustomId("absence_raison")
      .setLabel("Raison")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(debut),
      new ActionRowBuilder().addComponents(fin),
      new ActionRowBuilder().addComponents(raison),
    );

    return interaction.showModal(modal);
  },
};
