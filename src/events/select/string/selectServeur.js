const {
  errorStaffContainer,
  discordStaff,
} = require("../../../../util/module/discordLink");
const { MessageFlags } = require("discord.js");

module.exports = {
  data: {
    name: "selectServeur",
  },

  async execute(client, interaction, config) {
    const serveur = interaction.values[0].split("-")[1];

    const parts = interaction.customId.split("-");
    const commandName = parts[1].replace(/_/g, "-");

    let indexArgsStart = 2;
    let subcommand = null;

    if (parts[2] && !parts[2].includes("=")) {
      subcommand = parts[2];
      indexArgsStart = 3;
    }

    interaction.parametre = {};
    for (const part of parts.slice(indexArgsStart)) {
      const [name, value] = part.split("=");
      interaction.parametre[name] = value;
    }
    interaction.subcommand = subcommand;

    const commandFile = require(
      `../../../../src/commands/slash/${commandName}.js`,
    );
    const permission = commandFile?.config?.permission;

    const [errorContainer, staffResult] = await Promise.all([
      errorStaffContainer(serveur),
      permission
        ? discordStaff(interaction.user.id, serveur, permission)
        : null,
    ]);

    if (errorContainer) {
      return interaction.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (staffResult?.container) {
      return interaction.reply({
        components: [staffResult.container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    interaction.parametre.serveur = serveur;

    return commandFile.proxy(client, interaction, config);
  },
};
