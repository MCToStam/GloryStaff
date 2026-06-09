const {
  MessageFlags,
  ContainerBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const { getServeur } = require("../../../../util/module/getServeur");
const { discordLink } = require("../../../../util/module/discordLink");
const Absense = require("../../../../util/database/models/Absence");

module.exports = {
  data: {
    name: "absence_delete",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);

    const [, userId, id] = interaction.customId.split("-");
    const pseudo = await discordLink(userId);

    const result = await Absense.deleteOne({
      staff: pseudo,
      serveur,
      id: Number(id),
    });

    if (result.deletedCount === 0) {
      return interaction.reply({
        content: "❌ Absence introuvable.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const container = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## ✅ Absence Supprimée"),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("L'absence a correctement été supprimée."),
      );

    return interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
