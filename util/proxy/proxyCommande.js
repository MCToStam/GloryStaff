const {
  StringSelectMenuBuilder,
  MessageFlags,
  ContainerBuilder,
} = require("discord.js");
const { getServerCommand } = require("../../util/getServerCommand");
const {
  errorStaffContainer,
  discordStaff,
} = require("../../util/module/discordLink");
const config = require("../../config");

async function proxyCommande(interaction) {
  const commandFile = require(
    `../../src/commands/slash/${interaction.commandName}.js`,
  );
  const permission = commandFile?.config?.permission;

  let serveur = interaction.options.getString("serveur")?.toLowerCase();
  if (!serveur)
    serveur = await getServerCommand(interaction.guild.id, interaction.user.id);

  if (serveur && typeof serveur === String) {
    const errorContainer = await errorStaffContainer(serveur);

    if (errorContainer) {
      return interaction.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (permission) {
      const { container } = await discordStaff(
        interaction.user.id,
        serveur,
        permission,
      );

      if (container) {
        interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
        return;
      }
    }
    return serveur;
  } else if (serveur && Array.isArray(serveur)) {
    const options = serveur
      .filter((srv) => config.liste_serveur.includes(srv))
      .map((srv) => ({
        label: srv.charAt(0).toUpperCase() + srv.slice(1),
        value: `selectServeur_${srv}`,
        emoji: config.emoji[srv],
      }));

    const container = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((t) => t.setContent("## ❌ Aucun Serveur"))
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          "Plusieurs serveurs ont été trouvés associés associés à votre compte NationsGlory, veuillez choisir celui concercé par votre commande.",
        ),
      )
      .addSeparatorComponents((s) => s)
      .addActionRowComponents((row) =>
        row.setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("selectServeur")
            .setPlaceholder("Choisit un serveur")
            .setOptions(options),
        ),
      );

    interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
    return;
  } else {
    const container = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## ❌ Aucun Serveur"),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          "Aucun serveur par défaut n'a été trouvé pour votre utilisateur Discord, veuillez en spécifier un manuellement.",
        ),
      );

    interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
    return;
  }
}

module.exports = proxyCommande;
