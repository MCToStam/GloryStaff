const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
} = require("discord.js");
const { getData } = require("../../../util/module/getAndSaveData");
const { getEmojiDrapeau, getEmojiTete } = require("../../../util/module/emoji");
const { discordLink } = require("../../../util/module/discordLink");
const proxyCommande = require("../../../util/proxy/proxyCommande");

module.exports = {
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

    const configExpansion = getData(
      `data/${serveur}/config-expansionterritoriale.json`,
    );

    if (!configExpansion["Conquête Territoriale"]?.active) {
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
            } ${serveur.charAt(0).toUpperCase() + serveur.slice(1)}.`,
          ),
        );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (!configExpansion["Conquête Territoriale"]?.Salon.valeur) {
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
            }, le choix du salon est manquant.`,
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
    const tete = await getEmojiTete(client, pseudo);
    const drapeauA = await getEmojiDrapeau(client, serveur, paysa);
    const drapeauB = await getEmojiDrapeau(client, serveur, paysb);

    const container = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((t) =>
        t.setContent("## ✈️ Conquête Territoriale"),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `${tete} **${pseudo}** vient de valider la conquête territoriale du pays ${drapeauA} **${paysa}**. Ce pays a donc annexé le pays ${drapeauB} **${paysb}**.`,
        ),
      );

    const salon = await client.channels.fetch(
      configExpansion["Conquête Territoriale"]?.Salon.valeur,
    );

    let message;
    if (configExpansion["Conquête Territoriale"].Role.valeur.length > 0) {
      const roleMentions = configExpansion["Conquête Territoriale"]?.Role.valeur
        .map((roleId) => `<@&${roleId}>`)
        .join(", ");

      const roleTextDisplay = new TextDisplayBuilder().setContent(roleMentions);
      message = await salon.send({
        components: [roleTextDisplay, container],
        flags: MessageFlags.IsComponentsV2,
      });
    } else {
      message = await salon.send({
        components: [container],
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
