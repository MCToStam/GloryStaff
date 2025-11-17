const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const { getData } = require("../../../util/module/getAndSaveData");
const {
  errorStaffContainer,
  discordStaff,
} = require("../../../util/module/discordLink");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fullbuild")
    .setDescription("Valide un fullbuild")
    .addStringOption((option) =>
      option
        .setName("serveur")
        .setDescription("Le serveur pour lequel valider un fullbuild")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("paysa")
        .setDescription("Pays pour lequel le fullbuild est validé")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("paysb")
        .setDescription("Pays pour lequel le pays-a va s'étendre")
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async execute(client, interaction, config) {
    const serveur = interaction.options.getString("serveur");

    const { errorContainer } = await errorStaffContainer(serveur);

    if (errorContainer) {
      return interaction.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const { pseudonym, servers, container } = await discordStaff(
      interaction.user.id,
      serveur,
    );

    if (container) {
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const paysa = interaction.options.getString("pays-a");
    const paysb = interaction.options.getString("pays-b");

    const configExpansion = getData(
      `data/${serveur}/config-expansionterritoriale.json`,
    );

    if (!configExpansion["Full Build"]?.active) {
      const erreurEmbed = new EmbedBuilder()
        .setTitle("Erreur")
        .setColor(config.errorcolor)
        .setDescription(
          `Le système de fullbuild n'est pas configuré sur le serveur <:NG${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }:${config.emoji[serveur.toLowerCase()]}> **${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }** !`,
        )
        .setFooter({ text: config.footer });
      return interaction.reply({ embeds: [erreurEmbed], ephemeral: true });
    }

    if (!configExpansion["Full Build"]?.Salon.valeur) {
      const erreurEmbed = new EmbedBuilder()
        .setTitle("Erreur")
        .setColor(config.errorcolor)
        .setDescription(
          `Le système de fullbuild n'est pas complètement configuré sur le serveur <:NG${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }:${config.emoji[serveur.toLowerCase()]}> **${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }** !`,
        )
        .setFooter({ text: config.footer });
      return interaction.reply({ embeds: [erreurEmbed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("🏚️ FullBuild")
      .setColor(config.couleur[serveur])
      .setDescription(
        `<@${interaction.user.id}> vient de valider le fullbuild de pays **${paysa}**. Ce pays a donc maintenant la permission de s'étendre sur le pays **${paysb}**.`,
      )
      .setFooter({ text: config.footer })
      .setThumbnail(
        `${config.glorybot_url}/api/drapeau?serveur=${serveur}&pays=${paysa}`,
      );

    const salon = interaction.client.channels.fetch(
      configExpansion["Full Build"]?.Salon.valeur,
    );

    const roleIds = configExpansion["Full Build"]?.Role.valeur;

    const roleMentions =
      Array.isArray(roleIds) && roleIds.length > 0
        ? roleIds.map((roleId) => `<@&${roleId}>`).join(", ")
        : undefined;

    const message = await salon.send({
      embeds: [embed],
      content: roleMentions,
    });

    const messageLink = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;

    const userEmbed = new EmbedBuilder()
      .setTitle("🏚️ FullBuild")
      .setColor(config.couleur[serveur])
      .setDescription(
        `Le fullbuild est correctement validé et a été envoyé ici : ${messageLink}`,
      )
      .setFooter(config.footer);

    interaction.reply({ embeds: [userEmbed], ephemeral: true });

    if (salon.type === "GUILD_NEWS") {
      try {
        await message.crosspost();
        console.log(
          `📣 Message publié dans le salon d’annonce pour ${serveur}`,
        );
      } catch (err) {
        console.warn(
          `⚠️ Impossible de publier le message dans le salon d’annonce : ${err.message}`,
        );
      }
    }
  },
};
