const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getData } = require("../../../util/module/getAndSaveData");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("conquête-territoriale")
    .setDescription("Valide une conquête territoriale")
    .addStringOption((option) =>
      option
        .setName("serveur")
        .setDescription(
          "Le serveur pour lequel valider une conquête territoriale"
        )
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("paysa")
        .setDescription("Pays pour lequel la conquête est validé")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("paysb")
        .setDescription("Pays annexé par le pays-a")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async execute(client, interaction, config) {
    const serveur = interaction.options.getString("serveur");
    const paysa = interaction.options.getString("pays-a");
    const paysb = interaction.options.getString("pays-b");

    const configExpansion = getData(`data/${serveur}/config-expansionterritoriale.json`)

    if (!configExpansion["Conquête Territoriale"]?.active) {
      const erreurEmbed = new EmbedBuilder()
        .setTitle("Erreur")
        .setColor(config.errorcolor)
        .setDescription(
          `Le système de conquête territoriale n'est pas configuré sur le serveur <:NG${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }:${config.emoji[serveur.toLowerCase()]}> **${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }** !`
        )
        .setFooter({ text: config.footer });
      return interaction.reply({ embeds: [erreurEmbed], ephemeral: true });
    }

    if (!configExpansion["Conquête Territoriale"]?.Salon) {
      const erreurEmbed = new EmbedBuilder()
        .setTitle("Erreur")
        .setColor(config.errorcolor)
        .setDescription(
          `Le système de conquête territoriale n'est pas complètement configuré sur le serveur <:NG${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }:${config.emoji[serveur.toLowerCase()]}> **${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }** !`
        )
        .setFooter({ text: config.footer });
      return interaction.reply({ embeds: [erreurEmbed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("✈️ Conquête Territoriale")
      .setColor(config.couleur[serveur])
      .setDescription(
        `<@${interaction.user.id}> vient de valider la conquête territoriale du pays **${paysa}**. Ce pays a donc annexé le pays **${paysb}**.`
      )
      .setFooter({ text: config.footer })
      .setThumbnail(
        `${config.glorybot_url}/api/drapeau?serveur=${serveur}&pays=${paysa}`
      );

    const salon = interaction.client.channels.fetch(
      configExpansion["Conquête Territoriale"]?.Salon
    );

    const roleIds = configExpansion["Conquête Territoriale"]?.Role;

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
      .setTitle("✈️ Conquête Territoriale")
      .setColor(config.couleur[serveur])
      .setDescription(
        `La conquête territoriale est correctement validé et a été envoyé ici : ${messageLink}`
      )
      .setFooter({ text: config.footer });

    interaction.reply({ embeds: [userEmbed], ephemeral: true });

    if (salon.type === "GUILD_NEWS") {
      try {
        await message.crosspost();
        console.log(
          `📣 Message publié dans le salon d’annonce pour ${serveur}`
        );
      } catch (err) {
        console.warn(
          `⚠️ Impossible de publier le message dans le salon d’annonce : ${err.message}`
        );
      }
    }
  },
};
