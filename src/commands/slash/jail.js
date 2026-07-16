const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
} = require("discord.js");
const { getData, saveData } = require("../../../util/module/getAndSaveData");
const { discordStaff } = require("../../../util/module/discordLink");
const { Jail } = require("../../../util/container/module");
const proxyCommande = require("../../../util/proxy/proxyCommande");
const Configuration = require("../../../util/database/models/Configuration");
const {
  buildErrorContainer,
  sendTemporaryError,
} = require("../../../util/proxy/reply");
const {
  getCachedEmojiTete,
  getEmojiTete,
} = require("../../../util/module/emoji");

module.exports = {
  data: new SlashCommandBuilder()
    .setContexts(0)
    .setName("jail")
    .setDescription("Éffectue un jail")
    .addStringOption((option) =>
      option
        .setName("criminel")
        .setDescription("Joueur qui doit subir le jail")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("durée")
        .setDescription("Durée du jail (ex: 1h, 30m)")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("lien_raison")
        .setDescription("Lien ou raison du jail")
        .setRequired(false),
    ),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },

  async proxy(client, interaction, config) {
    const { serveur, criminel, durée, lien_raison } = interaction.parametre;
    const srvConfig = config.serveur[serveur];
    const srvLabel = `${srvConfig.emoji_formate} ${srvConfig.nom}`;

    const match = durée.match(/^(\d+)([hmdb])$/);

    if (!match) {
      const errorContainer = buildErrorContainer(
        config,
        "❌ Durée Invalide",
        "La durée doit être au format suivant :\n`1h` (1 heure), `30m` (30 minutes), `2d` (2 jours), etc.\n Elle peut aussi être du format `100b` dans le cas d'un jailblock.",
      );

      return sendTemporaryError(interaction, errorContainer);
    }

    const UNITES = { h: "heure", m: "minute", d: "jour", b: "bloc" };
    const quantite = parseInt(match[1], 10);
    const unite = match[2];
    const dureeLisible = `${quantite} ${UNITES[unite]}${quantite > 1 ? "s" : ""}`;

    const [searchRes, configJail] = await Promise.all([
      fetch(
        `https://apiv2.nationsglory.fr/forums/userSearch?search=${criminel}`,
      ),
      Configuration.findOne({
        serveur,
        guildId: interaction.guild.id,
        categorie: "Jail",
        systeme: "Jail",
      }),
    ]);

    const similarUsers = await searchRes.json();
    const foundUser = similarUsers.find(
      (user) => user.username.toLowerCase() === criminel.toLowerCase(),
    );

    if (!foundUser) {
      const suggestions = similarUsers
        .map((user) => `- ${user.username.replace(/_/g, "\\_")}`)
        .join("\n");

      const errorContainer = buildErrorContainer(
        config,
        "❌ Criminel Invalide",
        similarUsers.length === 0
          ? "L'utilisateur que vous recherchez n'existe pas."
          : `L'utilisateur que vous recherchez n'existe pas, il s'agit peut-être de\n\n${suggestions}`,
      );

      return sendTemporaryError(interaction, errorContainer);
    }

    const vraiCriminel = foundUser.username;

    if (!configJail || !configJail.active) {
      const errorContainer = buildErrorContainer(
        config,
        "❌ Système Désactivé",
        `Le système de Jail est désactivé sur le serveur ${srvLabel} pour votre serveur Discord.`,
      );

      return sendTemporaryError(interaction, errorContainer);
    }

    if (!configJail.data.get("Salon") || !configJail.data.get("Grade")) {
      const errorContainer = buildErrorContainer(
        config,
        "❌ Configuration Invalide",
        `Le système de Jail n'est pas correctement configuré sur le serveur ${srvLabel} pour votre serveur Discord, le choix du salon et/ou du grade autorisé est manquant.`,
      );

      return sendTemporaryError(interaction, errorContainer);
    }

    const roleAutorise = configJail.data.get("Grade");

    const [{ container }, salon] = await Promise.all([
      discordStaff(interaction.user.id, serveur, roleAutorise),
      interaction.client.channels.fetch(configJail.data.get("Salon")),
    ]);

    if (container) return sendTemporaryError(interaction, container);

    const cacheEmoji = getCachedEmojiTete(vraiCriminel);
    const { components } = await Jail(
      client,
      serveur,
      vraiCriminel,
      dureeLisible,
      lien_raison ?? false,
      cacheEmoji,
    );

    const message = await salon.send({
      components,
      flags: MessageFlags.IsComponentsV2,
    });

    const thread = await message.startThread({
      name: `Connexion de ${vraiCriminel}`,
      autoArchiveDuration: 4320,
      reason: `Fil automatique pour les connexions de ${vraiCriminel}`,
    });

    const introContainer = new ContainerBuilder()
      .setAccentColor(srvConfig.couleur)
      .addTextDisplayComponents((t) =>
        t.setContent(`## 🔎 Connexion de ${vraiCriminel.replace(/_/g, "\\_")}`),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          "Vous serez avertis dès lors que le joueur se connectera dans ce fil.",
        ),
      );

    await thread.send({
      components: [introContainer],
      flags: MessageFlags.IsComponentsV2,
    });

    const jailDataPath = `data/${serveur}/jail.json`;
    const jailData = getData(jailDataPath);

    jailData[vraiCriminel] ??= [];
    jailData[vraiCriminel].push({
      duree: dureeLisible,
      lien: lien_raison,
      messageId: message.id,
      threadId: thread.id,
      channelId: message.channelId,
      connecte: false,
      jailed: false,
    });

    saveData(jailDataPath, jailData);

    const messageLink = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;

    const userContainer = new ContainerBuilder()
      .setAccentColor(srvConfig.couleur)
      .addTextDisplayComponents((t) => t.setContent("## 🚧 Jail"))
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(`Le jail a correctement été envoyé ici : ${messageLink}`),
      );

    sendTemporaryError(interaction, userContainer);

    const vraiEmoji = await getEmojiTete(client, vraiCriminel);

    const { components: updatedComponents } = await Jail(
      client,
      serveur,
      vraiCriminel,
      dureeLisible,
      lien_raison ?? false,
      vraiEmoji,
    );

    await salon.messages.edit(message.id, {
      components: updatedComponents,
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
