const { MessageFlags, ContainerBuilder } = require("discord.js");

module.exports = {
  data: {
    name: "gestionstaff_routine",
  },

  async execute(client, interaction, config) {
    const container = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((t) => t.setContent("## Erreur"))
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          "Ce système est encore en phase de développement, l'interface n'est donc pas encore disponible.",
        ),
      );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
