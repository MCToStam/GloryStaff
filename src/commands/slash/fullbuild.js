const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getData } = require("../../../util/module/getAndSaveData");

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

    if (serveur === "non-lie") {
      const erreurEmbed = new EmbedBuilder()
        .setTitle("Erreur")
        .setColor(config.errorcolor)
        .setDescription(
          'Votre compte Discord n\'est pas reconnu, il vous faut être renseigné pour utiliser cette commande. Pour ce faire, il te suffit de te connecter à notre panel de contrôle. Une fois connecté avec ton compte Discord, va dans la partie "Profil" puis tu as un bouton afin de lier ton compte NationsGlory.',
        )
        .setFooter({ text: config.footer });

      const panelButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("💻 Accéder au panel")
          .setStyle(ButtonStyle.Link)
          .setURL("https://glorybot.fr"),
      );

      return interaction.reply({
        embeds: [erreurEmbed],
        components: [panelButton],
        ephemeral: true,
      });
    }

    if (serveur !== "all" && !config.liste_serveur.includes(serveur)) {
      const unknownServerEmbed = {
        title: "Erreur",
        description: `Le serveur **${serveur}** n'est pas un serveur reconnu. Veuillez fournir un serveur valide.`,
        color: config.errorcolor,
        footer: { text: config.footer },
      };
      return interaction.reply({
        embeds: [unknownServerEmbed],
        ephemeral: true,
      });
    }

    const capitalizedServeur =
      serveur.charAt(0).toUpperCase() + serveur.slice(1);
    const emojiId = config.emoji[serveur.toLowerCase()];

    if (serveur === "permission") {
      const permissionEmbed = {
        title: "Erreur",
        description: `Tu n'as pas la permission d'effectuer cette commande pour le serveur <:NG${capitalizedServeur}:${emojiId}> **${capitalizedServeur}** !`,
        color: config.errorcolor,
        footer: { text: config.footer },
      };
      return interaction.reply({ embeds: [permissionEmbed], ephemeral: true });
    }

    const staffData = getData(`data/${serveur}/staff.json`);

    const isAdmin = staffData["Administrateur"]?.includes(interaction.user.id);
    const isSM = staffData["Super-Modérateur"]?.includes(interaction.user.id);
    if (!isAdmin && !isSM && interaction.user.id != config.developpeur) {
      const permissionEmbed = {
        title: "Erreur",
        description: `Tu n'as pas la permission d'effectuer cette commande !`,
        color: config.errorcolor,
        footer: { text: config.footer },
      };
      return interaction.reply({ embeds: [permissionEmbed], ephemeral: true });
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

    if (!configExpansion["Full Build"]?.Salon) {
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
      configExpansion["Full Build"]?.Salon,
    );

    const roleIds = configExpansion["Full Build"]?.Role;

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
