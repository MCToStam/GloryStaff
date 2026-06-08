const log = require("../../../util/module/log");
const {
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const config = require("../../../config.js");

module.exports = async (client, interaction) => {
  const userCmd = client.container.userCmds.get(interaction.commandName);
  if (!userCmd) return;

  try {
    await userCmd.execute(client, interaction);
  } catch (e) {
    const errorContainer = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## ❌ Erreur"),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          "Une erreur est survenue lors de l'exécution de cette intéraction. Si le problème se reproduit, il est important de le signaler sur le serveur support.",
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setURL("https://discord.gg/tFkb9nYSd8")
            .setEmoji("1307452239052279858")
            .setLabel("Serveur Support")
            .setStyle(ButtonStyle.Link),
        ),
      );

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] },
      });
    } else {
      await interaction.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] },
      });
    }
    log(e, "error", "red");

    const channel = await client.channels.fetch(config.log_channels.error);

    const errorLogContainer = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## ❌ Erreur"),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `**🔧 Action Effectuée :** ${interaction.commandName}`,
        ),
      )
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(`**💢 Erreur :** \`\`\`${e}\`\`\``),
      );

    await channel.send({
      components: [errorLogContainer],
      flags: 32768,
      allowedMentions: { parse: [] },
    });
  }

  const channel = await client.channels.fetch(config.log_channels.command);

  const logContainer = new ContainerBuilder()
    .setAccentColor(config.colors.success)
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent("## 📗 Log"),
    )
    .addSeparatorComponents((separator) => separator)
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        `**👷 Utilisateur :** ${
          interaction.user.globalName?.replace(/_/g, "\\_") ||
          interaction.user.username?.replace(/_/g, "\\_")
        } (<@${interaction.user.id}>)\n**🔧 Valeur :** ${interaction.commandName}`,
      ),
    );

  await channel.send({
    components: [logContainer],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  });
};
