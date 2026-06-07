const {
  MessageFlags,
  ContainerBuilder,
  SlashCommandBuilder,
} = require("discord.js");

module.exports = {
  serveur: ["743741992194015314"],
  data: new SlashCommandBuilder()
    .setName("cmd")
    .setDescription("⛔ Gestionnaire de commandes slash")
    .addSubcommand((sub) =>
      sub
        .setName("deploy")
        .setDescription("⛔ Déploiement des commandes")
        .addStringOption((opt) =>
          opt
            .setName("canal")
            .setDescription("Canal de déploiement")
            .setRequired(false)
            .addChoices([
              {
                name: "global",
                value: "global",
              },
            ]),
        )
        .addStringOption((opt) =>
          opt
            .setName("server")
            .setDescription("ID du serveur")
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("⛔ Supression des commandes")
        .addStringOption((opt) =>
          opt
            .setName("canal")
            .setDescription("Canal de supression")
            .setRequired(false)
            .addChoices([
              {
                name: "global",
                value: "global",
              },
            ]),
        )
        .addStringOption((opt) =>
          opt
            .setName("server")
            .setDescription("ID du serveur")
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("edit")
        .setDescription("⛔ Édition d'une commande")
        .addStringOption((opt) =>
          opt
            .setName("name")
            .setDescription("Nom de la commande")
            .setAutocomplete(true),
        ),
    ),

  async execute(client, interaction, config) {
    const subCmd = interaction.options.getSubcommand();
    const canal = interaction.options.getString("canal");
    const server = interaction.options.getString("server");
    const guild = server ? client.guilds.cache.get(server) : interaction.guild;
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const globalCmds = client.application.commands;
    const guildCmds = guild.commands;
    const { container } = client;
    const slashCmds = container.slashCmds;

    const cmds = slashCmds.filter(
      (c) => c.load !== false && (!c.serveur || c.serveur.length === 0),
    );

    const deployMsg = `Les commandes ont été déployées sur le {{CANAL}} \`{{CANAL_NAME}}\` !`;
    const removeMsg = `Les commandes présentes sur le {{CANAL}} \`{{CANAL_NAME}}\` ont été supprimées !`;

    if (subCmd === "deploy") {
      if (canal === "global") {
        const globalCmdsToDeploy = slashCmds.filter(
          (c) => c.load !== false && (!c.serveur || c.serveur.length === 0),
        );
        await globalCmds.set(globalCmdsToDeploy.map((c) => c.data));

        for (const [id, g] of client.guilds.cache) {
          const guildCmds = g.commands;

          const serverCmdsToDeploy = slashCmds.filter(
            (c) => c.load !== false && c.serveur?.includes(id),
          );

          await guildCmds.set(serverCmdsToDeploy.map((c) => c.data));
        }

        const msg = deployMsg
          .replace("{{CANAL}}", "canal")
          .replace("{{CANAL_NAME}}", "global");

        const goodContainer = new ContainerBuilder()
          .setAccentColor(config.colors.success)
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent("## ✅ Succès"),
          )
          .addSeparatorComponents((separator) => separator)
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(msg),
          );

        return interaction.editReply({
          components: [goodContainer],
          allowedMentions: { parse: [] },
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      } else {
        return guildCmds
          .set(cmds.map((c) => c.data))
          .then(() => {
            const msg = deployMsg
              .replace("{{CANAL}}", "serveur")
              .replace("{{CANAL_NAME}}", guild.name);

            const goodContainer = new ContainerBuilder()
              .setAccentColor(config.colors.success)
              .addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent("## ✅ Succès"),
              )
              .addSeparatorComponents((separator) => separator)
              .addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent(msg),
              );

            return interaction.editReply({
              components: [goodContainer],
              allowedMentions: { parse: [] },
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });
          })
          .catch((e) => console.error(e));
      }
    } else if (subCmd === "remove") {
      if (canal === "global") {
        return globalCmds
          .set([])
          .then(() => {
            const msg = removeMsg
              .replace("{{CANAL}}", "canal")
              .replace("{{CANAL_NAME}}", "global");

            const goodContainer = new ContainerBuilder()
              .setAccentColor(config.colors.success)
              .addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent("## ✅ Succès"),
              )
              .addSeparatorComponents((separator) => separator)
              .addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent(msg),
              );

            return interaction.editReply({
              components: [goodContainer],
              allowedMentions: { parse: [] },
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });
          })
          .catch((e) => console.error(e));
      } else {
        return guildCmds
          .set(cmds.filter((c) => c.data.name === "cmd").map((c) => c.data))
          .then(() => {
            const msg = removeMsg
              .replace("{{CANAL}}", "serveur")
              .replace("{{CANAL_NAME}}", guild.name);

            const goodContainer = new ContainerBuilder()
              .setAccentColor(config.colors.success)
              .addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent("## ✅ Succès"),
              )
              .addSeparatorComponents((separator) => separator)
              .addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent(msg),
              );

            return interaction.editReply({
              components: [goodContainer],
              allowedMentions: { parse: [] },
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });
          })
          .catch((e) => console.error(e));
      }
    } else if (subCmd === "edit") {
      const collection = slashCmds;
      const name = interaction.options.getString("name");
      const command = slashCmds.get(name);

      if (!command) {
        const erreurContainer = new ContainerBuilder()
          .setAccentColor(config.colors.error)
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent("## ❌ Erreur"),
          )
          .addSeparatorComponents((separator) => separator)
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(`La commande "${name}" n'existe pas.`),
          );

        return interaction.editReply({
          components: [erreurContainer],
          allowedMentions: { parse: [] },
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      const folder = `./`;
      const data = command.data.name;

      delete require.cache[require.resolve(`${folder}${data}.js`)];
      await collection.delete(data);

      const props = require(`${folder}${data}.js`);
      await collection.set(data, props);

      const goodContainer = new ContainerBuilder()
        .setAccentColor(config.colors.success)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent("## ✅ Succès"),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(`La commande \`${data}\` a été rechargée !`),
        );

      return interaction.editReply({
        components: [goodContainer],
        allowedMentions: { parse: [] },
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }
  },
  async autocomplete(client, interaction) {
    const focusedValue = interaction.options.getFocused(true);
    const optionName = focusedValue.name;

    if (optionName === "name") {
      const { container } = client;
      const slashCmds = container.slashCmds;

      const cmdsDatas = slashCmds
        .filter((x) =>
          x.data.name.toLowerCase().includes(focusedValue.value.toLowerCase()),
        )
        .map((x) => ({ name: x.data.name, value: x.data.name }))
        .slice(0, 25);

      return interaction.respond(cmdsDatas);
    }

    if (optionName === "server") {
      const servers = client.guilds.cache
        .filter(
          (g) =>
            g.name.toLowerCase().includes(focusedValue.value.toLowerCase()) ||
            g.id.includes(focusedValue.value),
        )
        .map((g) => ({
          name: `${g.name} (${g.id})`,
          value: g.id,
        }))
        .slice(0, 25);

      return interaction.respond(servers);
    }
  },
};
