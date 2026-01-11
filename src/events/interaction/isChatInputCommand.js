const {
  Collection,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const config = require("../../../config.js");
const log = require("../../../util/module/log.js");

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
    const disabledContainer = {
      type: 17,
      accent_color: config.colors.error,
      components: [
        {
          type: 10,
          content: "## :no_entry_sign: Commande Désactivée ",
        },
        {
          type: 14,
          spacing: SeparatorSpacingSize.Large,
        },
        {
          type: 10,
          content: "Cette commande est désactivé et donc innaccessible.",
        },
      ],
    };
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
        const cooldownContainer = {
          type: 17,
          accent_color: config.colors.error,
          components: [
            {
              type: 10,
              content: "## :no_entry_sign: Cooldown ",
            },
            {
              type: 14,
              spacing: SeparatorSpacingSize.Large,
            },
            {
              type: 10,
              content: `Cette commande est actuellement sous cooldown, tu pourras la réutiliser <t:${expiredTimestamp}:R>.`,
            },
          ],
        };
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
    const errorContainer = {
      type: 17,
      accent_color: config.colors.error,
      components: [
        {
          type: 10,
          content: "## :x: Une erreur est survenue",
        },
        {
          type: 14,
          spacing: SeparatorSpacingSize.Large,
        },
        {
          type: 10,
          content:
            "Une erreur est survenue lors de l'exécution de cette intéraction. Si le problème se reproduit, il est important de le signaler sur le [serveur support](https://discord.gg/tFkb9nYSd8).",
        },
      ],
    };

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

    const errorLogContainer = {
      type: 17,
      accent_color: config.colors.error,
      components: [
        {
          type: 10,
          content: "## ❌ Erreur",
        },
        {
          type: 14,
          spacing: 1,
        },
        {
          type: 10,
          content: `**🔧 Action Effectuée :** ${interaction.commandName}`,
        },
        {
          type: 10,
          content: `**💢 Erreur :** \`\`\`${e}\`\`\``,
        },
      ],
    };

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

  const logContainer = {
    type: 17,
    accent_color: config.colors.success,
    components: [
      {
        type: 10,
        content: "## 📗 Log",
      },
      {
        type: 14,
        spacing: SeparatorSpacingSize.Small,
      },
      {
        type: 10,
        content: `**👷 Utilisateur :** ${
          interaction.user.globalName?.replace(/_/g, "\\_") ||
          interaction.user.username
        } (<@${interaction.user.id}>)\n**🔧 Valeur :** ${commandPath}`,
      },
    ],
  };

  await channel.send({
    components: [logContainer],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  });
};
