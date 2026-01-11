const { SeparatorSpacingSize, MessageFlags } = require("discord.js");
const log = require("../../../util/module/log.js");
const config = require("../../../config.js");

module.exports = async (client, interaction) => {
  const stringSelect = client.container.stringSelects.get(
    interaction.values[0].split("-")[0],
  );

  if (!stringSelect) return;
  if (
    interaction.message?.interaction &&
    interaction.user.id !== interaction.message.interaction.user.id
  ) {
    const permissionContainer = {
      type: 17,
      accent_color: config.colors.error,
      components: [
        {
          type: 10,
          content: "## :no_entry_sign: Intéraction Interdite ",
        },
        {
          type: 14,
          spacing: SeparatorSpacingSize.Large,
        },
        {
          type: 10,
          content:
            "Vous n'avez pas la permission d'intéragir avec ce sélectionneur car vous n'êtes pas l'auteur de la commande.",
        },
      ],
    };
    return interaction.reply({
      components: [permissionContainer],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  }

  try {
    await stringSelect.execute(client, interaction, config);
  } catch (e) {
    console.log(e);
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
          content: `**🔧 Action Effectuée :** ${interaction.customId}`,
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

  const channel = await client.channels.fetch(config.log_channels.selectMenu);

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
        } (<@${interaction.user.id}>)\n**🔧 Valeur :** ${interaction.customId}`,
      },
    ],
  };

  await channel.send({
    components: [logContainer],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  });
};
