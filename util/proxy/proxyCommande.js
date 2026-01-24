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
  const argsSansServeur = interaction.options.data
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

  const commandFile = require(`../../src/commands/slash/${commandName}.js`);
  const permission = commandFile?.config?.permission;

  let serveur = interaction.options.getString("serveur")?.toLowerCase();
  if (!serveur && commandName === "punisher") serveur = "all";
  if (!serveur)
    serveur = await getServerCommand(
      interaction.guild?.id,
      interaction.user.id,
    );

  if (serveur && typeof serveur === "string") {
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
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
    }

    interaction.parametre.serveur = serveur;

    await commandFile.proxy(client, interaction, config);
  } else if (serveur && Array.isArray(serveur)) {
    const options = serveur
      .filter((srv) => config.liste_serveur.includes(srv))
      .map((srv) => ({
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
              `selectServeur-${commandName.replace(/-/g, "_")}-${encodedArgs}`,
            )
            .setPlaceholder("Choisit un serveur")
            .setOptions(options),
        ),
      );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
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

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  }
}

module.exports = proxyCommande;
