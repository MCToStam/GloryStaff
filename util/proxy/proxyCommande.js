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

function infoContainer(config, title, description) {
  return new ContainerBuilder()
    .setAccentColor(config.colors.error)
    .addTextDisplayComponents((t) => t.setContent(`## ${title}`))
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) => t.setContent(description));
}

async function proxyCommande(client, interaction, config) {
  const commandName = interaction.commandName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]|[^a-zA-Z0-9_-]/g, "")
    .toLowerCase();

  const subcommand = interaction.options.getSubcommand(false);

  const argsSansServeur = [];
  for (const opt of interaction.options.data) {
    const opts = opt.type === 1 ? opt.options || [] : [opt];
    for (const o of opts) {
      if (o.name !== "serveur")
        argsSansServeur.push({ name: o.name, value: o.value });
    }
  }

  interaction.parametre = Object.fromEntries(
    argsSansServeur.map((arg) => [arg.name, arg.value]),
  );
  interaction.subcommand = subcommand;

  const serveur = await getServerCommand(
    interaction.guild?.id,
    interaction.user.id,
  );

  if (serveur.length === 0) {
    return interaction.reply({
      components: [
        infoContainer(
          config,
          "❌ Aucun Serveur",
          "Aucun serveur par défaut n'a été trouvé pour votre utilisateur Discord, assurez vous d'avoir lié votre compte Discord avec votre compte NationsGlory ainsi que d'être membre du staff d'un serveur NationsGlory.",
        ),
      ],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  }

  if (serveur.length === 1) {
    const [srv] = serveur;

    const commandFile = require(`../../src/commands/slash/${commandName}.js`);
    const permission = commandFile?.config?.permission;

    const [errorContainer, staffResult] = await Promise.all([
      errorStaffContainer(srv),
      permission ? discordStaff(interaction.user.id, srv, permission) : null,
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

    interaction.parametre.serveur = srv;
    return commandFile.proxy(client, interaction, config);
  }

  const options = serveur.map((srv) => ({
    label: config.serveur[srv].nom,
    value: `selectServeur-${srv}`,
    emoji: config.serveur[srv].emoji,
  }));

  const encodedArgs = argsSansServeur
    .map((arg) => `${arg.name}=${arg.value}`)
    .join("-");

  const container = infoContainer(
    config,
    "❌ Plusieurs Serveurs",
    "Plusieurs serveurs ont été trouvés associés à votre compte NationsGlory, veuillez choisir celui concerné par votre commande.",
  )
    .addSeparatorComponents((s) => s)
    .addActionRowComponents((row) =>
      row.setComponents(
        new StringSelectMenuBuilder()
          .setCustomId(
            `selectServeur-${commandName.replace(/-/g, "_")}${subcommand ? `-${subcommand}` : ""}${encodedArgs ? `-${encodedArgs}` : ""}`,
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

module.exports = proxyCommande;
