const log = require("../../../util/module/log.js");
const { MessageFlags, SeparatorSpacingSize } = require("discord.js");
const config = require("../../../config.js");

module.exports = async (client, interaction) => {
  const msgCmd = client.container.msgCmds.get(interaction.commandName);
  if (!msgCmd) return;

  try {
    await msgCmd.execute(client, interaction);
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
  }
};
