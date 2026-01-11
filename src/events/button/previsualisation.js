const { ContainerBuilder, MessageFlags } = require("discord.js");

module.exports = {
  data: {
    name: "previsualisation",
  },

  async execute(client, interaction, config) {
    const container = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(`## ❌ Prévisualisation Indisponible`),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          "Ce module ne permet pas encore d'en afficher une prévisualisation, elle sera sûrement disponible bientôt !",
        ),
      );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
