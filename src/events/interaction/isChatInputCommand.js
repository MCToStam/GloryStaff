const {
  Collection,
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const config = require("../../../config.js");
const log = require("../../../util/module/log");

function formatOptions(options) {
  return options
    .map((opt) => {
      if (opt.type === 1 || opt.type === 2) {
        const sub = formatOptions(opt.options || []);
        return `${opt.name}${sub ? " " + sub : ""}`;
      } else {
        return `<${opt.name}: ${opt.value}>`;
      }
    })
    .join(" ");
}

module.exports = async (client, interaction) => {
  const slashCmd = client.container.slashCmds.get(interaction.commandName);
  if (!slashCmd) return;

  if (slashCmd.conf?.disable) {
    const disabledContainer = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## 🚫 Commande Désactivée"),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          "Cette commande est désactivé et donc innaccessible.",
        ),
      );

    return interaction.reply({
      components: [disabledContainer],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  }

  const { cooldowns } = client;

  if (!cooldowns.has(slashCmd.data.name)) {
    cooldowns.set(slashCmd.data.name, new Collection());
  }

  if (interaction.user.id !== config.owner) {
    const now = Date.now();
    const timestamps = cooldowns.get(slashCmd.data.name);
    const defaultCooldownDuration = 5;
    const cooldownAmount =
      (slashCmd.conf?.cooldown ?? defaultCooldownDuration) * 1000;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime =
        timestamps.get(interaction.user.id) + cooldownAmount;

      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1000);
        const cooldownContainer = new ContainerBuilder()
          .setAccentColor(config.colors.error)
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent("## ⏱️ Cooldown"),
          )
          .addSeparatorComponents((separator) => separator)
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              `Cette commande est actuellement sous cooldown, tu pourras la réutiliser <t:${expiredTimestamp}:R>.`,
            ),
          );

        return interaction.reply({
          components: [cooldownContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        });
      }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
  }

  try {
    await slashCmd.execute(client, interaction, config);
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

  const formattedOptions = formatOptions(interaction.options.data);
  const commandPath = `/${interaction.commandName}${
    formattedOptions ? " " + formattedOptions : ""
  }`;

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
        } (<@${interaction.user.id}>)\n**🔧 Valeur :** ${commandPath.replace(/_/g, "\\_")}`,
      ),
    );

  await channel.send({
    components: [logContainer],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  });
};
