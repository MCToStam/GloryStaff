const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
} = require("discord.js");
const { discordStaff } = require("../../../util/module/discordLink");
const { Routine } = require("../../../util/container/module");
const proxyCommande = require("../../../util/proxy/proxyCommande");
const {
  buildErrorContainer,
  sendTemporaryError,
  replyOrUpdate,
} = require("../../../util/proxy/reply");
const Configuration = require("../../../util/database/models/Configuration");
const {
  getCachedEmojiTete,
  getEmojiTete,
} = require("../../../util/module/emoji");
const {
  editReplyIfCurrent,
  trackInteractionMessage,
} = require("../../../util/module/interactionMessageState");

module.exports = {
  data: new SlashCommandBuilder()
    .setContexts(0)
    .setName("routine")
    .setDescription("Effectue une routine"),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },

  async proxy(client, interaction, config) {
    const { serveur } = interaction.parametre;
    const guildId = interaction.guild.id;
    const srvConfig = config.serveur[serveur];
    const srvLabel = `${srvConfig.emoji_formate} ${srvConfig.nom}`;

    const configRoutine = await Configuration.findOne({
      serveur,
      guildId,
      categorie: "Routine",
      systeme: "Routine",
    });

    if (!configRoutine || !configRoutine.active) {
      return sendTemporaryError(
        interaction,
        buildErrorContainer(
          config,
          "❌ Système Désactivé",
          `Le système de Routine est désactivé sur le serveur ${srvLabel} pour votre serveur Discord.`,
        ),
      );
    }

    const salonId = configRoutine.data.get("Salon");
    const grade = configRoutine.data.get("Grade");

    if (!salonId || !grade) {
      return sendTemporaryError(
        interaction,
        buildErrorContainer(
          config,
          "❌ Configuration Invalide",
          `Le système de Routine n'est pas correctement configuré sur le serveur ${srvLabel} pour votre serveur Discord.`,
        ),
      );
    }

    const { pseudonym, container } = await discordStaff(
      interaction.user.id,
      serveur,
      grade,
    );

    if (container) {
      return sendTemporaryError(interaction, container);
    }

    const cachedEmoji = getCachedEmojiTete(
      pseudonym,
      "<:tete_default:1517896405841215619>",
    );
    const { components } = await Routine(
      client,
      serveur,
      pseudonym,
      cachedEmoji,
    );

    await replyOrUpdate(interaction, components);

    const tracker = await trackInteractionMessage(interaction);

    void (async () => {
      const emoji = await getEmojiTete(client, pseudonym);
      const { components: updatedComponents } = await Routine(
        client,
        serveur,
        pseudonym,
        emoji,
      );

      await editReplyIfCurrent(interaction, tracker, {
        components: updatedComponents,
        flags: MessageFlags.IsComponentsV2,
      });
    })();
  },
};
