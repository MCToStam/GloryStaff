const {
  StringSelectMenuBuilder,
  MessageFlags,
  ContainerBuilder,
} = require("discord.js");
const getServerCommand = require("../../util/getServerCommand");
const {
  errorStaffContainer,
  discordStaff,
} = require("../../util/module/discordLink");

async function proxyCommande(client, interaction, config) {
  const commandName = interaction.commandName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .toLowerCase();

  const subcommand = interaction.options.getSubcommand(false);

  const argsSansServeur = interaction.options.data
    .flatMap((opt) => {
      if (opt.type === 1) {
        return opt.options || [];
      }

      return [opt];
    })
    .filter((opt) => opt.name !== "serveur")
    .map((opt) => {
      return {
        name: opt.name,
        value: opt.value,
      };
    });

  interaction.parametre = Object.fromEntries(
    argsSansServeur.map((arg) => [arg.name, arg.value]),
  );

  interaction.subcommand = subcommand;

  const commandFile = require(`../../src/commands/slash/${commandName}.js`);
  const permission = commandFile?.config?.permission;

  const serveur = await getServerCommand(
    interaction.guild?.id,
    interaction.user.id,
  );

  if (serveur.length === 0) {
    const container = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## ❌ Aucun Serveur"),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          "Aucun serveur par défaut n'a été trouvé pour votre utilisateur Discord, assurez vous d'avoir lié votre compte Discord avec votre compte NationsGlory ainsi que d'être membre du staff d'un serveur NationsGlory.",
        ),
      );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  } else if (serveur.length === 1) {
    const errorContainer = await errorStaffContainer(serveur[0]);

    if (errorContainer) {
      return interaction.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (permission) {
      const { container } = await discordStaff(
        interaction.user.id,
        serveur[0],
        permission,
      );

      if (container) {
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
    }

    interaction.parametre.serveur = serveur[0];

    await commandFile.proxy(client, interaction, config);
  } else {
    const options = serveur.map((srv) => ({
      label: srv.charAt(0).toUpperCase() + srv.slice(1),
      value: `selectServeur-${srv}`,
      emoji: config.emoji[srv],
    }));

    const encodedArgs = argsSansServeur
      .map((arg) => `${arg.name}=${arg.value}`)
      .join("-");

    const container = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((t) => t.setContent("## ❌ Plusieurs Serveurs"))
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
            .setCustomId(
              `selectServeur-${commandName.replace(/-/g, "_")}${encodedArgs ? `-${encodedArgs}` : ""}`,
            )
            .setPlaceholder("Choisit un serveur")
            .setOptions(options),
        ),
      );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  }
}

module.exports = proxyCommande;
