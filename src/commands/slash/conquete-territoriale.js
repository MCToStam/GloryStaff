const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
} = require("discord.js");
const { getData } = require("../../../util/module/getAndSaveData");
const { discordLink } = require("../../../util/module/discordLink");
const { ConquêteTerritoriale } = require("../../../util/container/module");
const proxyCommande = require("../../../util/proxy/proxyCommande");

module.exports = {
  guild: true,
  config: { permission: "super_moderateur" },
  data: new SlashCommandBuilder()
    .setName("conquête-territoriale")
    .setDescription("Valide une conquête territoriale")
    .addStringOption((option) =>
      option
        .setName("paysa")
        .setDescription("Pays pour lequel la conquête est validé")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("paysb")
        .setDescription("Pays annexé par le pays-a")
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur, paysa, paysb } = interaction.parametre;

    const dataFile = getData(`data/${serveur}/config.json`);
    const configData = dataFile.find((c) => c.nom === "Expansion Territoriale");
    const configExpansion = configData.systeme["Conquête Territoriale"];

    const guildId = interaction.guild.id;

    if (!configExpansion.active[guildId]) {
      const container = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((t) =>
          t.setContent("## ❌ Système Désactivé"),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `Le système de Conquête Territoriale est désactivé sur le serveur ${
              config.emoji_formate[serveur]
            } ${serveur.charAt(0).toUpperCase() + serveur.slice(1)} pour votre serveur Discord.`,
          ),
        );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (!configExpansion.Salon.valeur[guildId]) {
      const container = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((t) =>
          t.setContent("## ❌ Configuration Invalide"),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `Le système de Conquête Territoriale n'est pas correctement configuré sur le serveur ${
              config.emoji_formate[serveur]
            } ${
              serveur.charAt(0).toUpperCase() + serveur.slice(1)
            } pour votre serveur Discord, le choix du salon est manquant.`,
          ),
        );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (interaction.isMessageComponent()) {
      await interaction.deferUpdate();
    } else {
      await interaction.deferReply();
    }

    const pseudo = await discordLink(interaction.user.id);

    const container = await ConquêteTerritoriale(
      client,
      serveur,
      pseudo,
      paysa,
      paysb,
    );

    const salon = await client.channels.fetch(
      configExpansion.Salon.valeur[guildId],
    );

    let message;
    if (configExpansion.Role.valeur[guildId].length > 0) {
      const roleMentions = configExpansion.Role.valeur[guildId]
        .map((roleId) => `<@&${roleId}>`)
        .join(", ");

      const roleTextDisplay = new TextDisplayBuilder().setContent(roleMentions);
      message = await salon.send({
        components: [roleTextDisplay, ...container],
        flags: MessageFlags.IsComponentsV2,
      });
    } else {
      message = await salon.send({
        components: container,
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const messageLink = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;

    const userContainer = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((t) =>
        t.setContent("## ✈️ Conquête Territoriale"),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `La conquête territoriale est correctement validé et a été envoyé ici : ${messageLink}`,
        ),
      );

    interaction.editReply({
      components: [userContainer],
      flags: MessageFlags.IsComponentsV2,
    });

    if (salon.type === "GUILD_NEWS") await message.crosspost();
  },
};
