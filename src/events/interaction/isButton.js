const { SeparatorSpacingSize, MessageFlags } = require("discord.js");
const log = require("../../../util/module/log.js");
const config = require("../../../config.js");

module.exports = async (client, interaction) => {
  const btn = client.container.buttons.get(interaction.customId.split("-")[0]);

  if (!btn) return;
  const originalMessage = interaction.message.reference
    ? await interaction.channel.messages.fetch(
        interaction.message.reference.messageId,
      )
    : interaction.message;

  if (btn.conf.type === "User") {
    const authorId = originalMessage.interaction?.user?.id;
    if (!authorId || interaction.user.id !== authorId) {
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
              "Vous n'avez pas la permission d'intéragir avec ce bouton car vous n'êtes pas l'auteur de la commande.",
          },
        ],
      };
      return interaction.reply({
        components: [permissionContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] },
      });
    }
  }

  try {
    await btn.execute(client, interaction, config);
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
  }

  const channel = await client.channels.fetch(config.log_channels.button);

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
