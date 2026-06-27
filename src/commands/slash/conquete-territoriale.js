const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
  ChannelType,
} = require("discord.js");
const { discordLink } = require("../../../util/module/discordLink");
const { ConquêteTerritoriale } = require("../../../util/container/module");
const proxyCommande = require("../../../util/proxy/proxyCommande");
const Configuration = require("../../../util/database/models/Configuration");
const {
  buildErrorContainer,
  sendTemporaryError,
} = require("../../../util/proxy/reply");
const {
  getCachedEmojiTete,
  getCachedEmojiDrapeau,
  getEmojiTete,
  getEmojiDrapeau,
} = require("../../../util/module/emoji");

module.exports = {
  config: { permission: "super_moderateur" },
  data: new SlashCommandBuilder()
    .setContexts(0)
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

    const configExpansion = await Configuration.findOne({
      serveur,
      guildId: interaction.guild.id,
      categorie: "Expansion Territoriale",
      systeme: "Conquête Territoriale",
    });

    if (!configExpansion.active) {
      const errorContainer = buildErrorContainer(
        config,
        "❌ Système Désactivé",
        `Le système de Conquête Territoriale est désactivé sur le serveur ${
          config.serveur[serveur].emoji_formate
        } ${config.serveur[serveur].nom} pour votre serveur Discord.`,
      );

      return sendTemporaryError(interaction, errorContainer);
    }

    if (!configExpansion.data.get("Salon")) {
      const errorContainer = buildErrorContainer(
        config,
        "❌ Configuration Invalide",
        `Le système de Conquête Territoriale n'est pas correctement configuré sur le serveur ${
          config.serveur[serveur].emoji_formate
        } ${
          config.serveur[serveur].nom
        } pour votre serveur Discord, le choix du salon est manquant.`,
      );

      return sendTemporaryError(interaction, errorContainer);
    }

    const pseudo = await discordLink(interaction.user.id);

    const cachedEmojis = {
      tete: getCachedEmojiTete(pseudo),
      drapeauA: getCachedEmojiDrapeau(serveur, paysa),
      drapeauB: getCachedEmojiDrapeau(serveur, paysb),
    };

    const { components } = await ConquêteTerritoriale(
      client,
      serveur,
      pseudo,
      paysa,
      paysb,
      cachedEmojis,
    );

    const salon = await client.channels.fetch(
      configExpansion.data.get("Salon"),
    );

    let roleTextDisplay = null;

    if (configExpansion.data.get("Role").length > 0) {
      const roleMentions = configExpansion.data
        .get("Role")
        .map((roleId) => `<@&${roleId}>`)
        .join(", ");
      roleTextDisplay = new TextDisplayBuilder().setContent(roleMentions);
    }

    const message = await salon.send({
      components: roleTextDisplay
        ? [roleTextDisplay, ...components]
        : components,
      flags: MessageFlags.IsComponentsV2,
    });

    const messageLink = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;

    const userContainer = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((t) =>
        t.setContent("## ✈️ Conquête Territoriale"),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `La conquête territoriale est correctement validé et a été envoyé ici : ${messageLink}`,
        ),
      );

    sendTemporaryError(interaction, userContainer);

    const [tete, drapeauA, drapeauB] = await Promise.all([
      getEmojiTete(client, pseudo),
      getEmojiDrapeau(client, serveur, paysa),
      getEmojiDrapeau(client, serveur, paysb),
    ]);

    const { components: updatedComponents } = await ConquêteTerritoriale(
      client,
      serveur,
      pseudo,
      paysa,
      paysb,
      { tete, drapeauA, drapeauB },
    );

    await salon.messages.edit(message.id, {
      components: roleTextDisplay
        ? [roleTextDisplay, ...updatedComponents]
        : updatedComponents,
      flags: MessageFlags.IsComponentsV2,
    });

    if (salon.type === ChannelType.GuildNews) await message.crosspost();
  },
};
