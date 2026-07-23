const {
  SlashCommandBuilder,
  MessageFlags,
  PermissionFlagsBits,
  ContainerBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const proxyCommande = require("../../../util/proxy/proxyCommande");
const {
  buildErrorContainer,
  sendTemporaryError,
} = require("../../../util/proxy/reply");

module.exports = {
  serveur: ["947964371072581694"],
  config: { permission: "moderateur_test" },
  data: new SlashCommandBuilder()
    .setName("requete-forum")
    .setDescription("Envoie une requête forum")
    .addStringOption((option) =>
      option
        .setName("raison")
        .setDescription("Raison de la requête forum")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("lien")
        .setDescription("Lien vers le post forum correspondant")
        .setRequired(true),
    ),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },

  async proxy(client, interaction, config) {
    const { serveur, lien, raison } = interaction.parametre;

    if (serveur !== "delta") {
      const errorContainer = buildErrorContainer(
        config,
        "❌ Système Désactivé",
        `Ce système n'est disponible uniquement sur le serveur **${config.serveur.delta.emoji_formate} ${config.serveur.delta.nom}**.`,
      );

      return sendTemporaryError(interaction, errorContainer);
    }

    const isLienValide =
      /^https:\/\/nationsglory\.fr\/forums\/thread\/\S+$/.test(lien);

    if (!isLienValide) {
      const errorContainer = buildErrorContainer(
        config,
        "❌ SLien Invalide",
        "Le lien doit correspondre à un post forum valide.",
      );

      return sendTemporaryError(interaction, errorContainer);
    }

    const container = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## 🖋️ Requête Forum"),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `**Raison :** ${raison}\n**Lien :** ${lien}\n**Ping :** <@&948020751338975283>`,
        ),
      )
      .addSeparatorComponents((s) => s)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("🔗 Aller sur le Forum")
            .setStyle(ButtonStyle.Link)
            .setURL(lien),
        ),
      );

    const salon = await interaction.client.channels.fetch(
      "1009489371730300949",
    );

    await salon.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    const userContainer = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((t) => t.setContent("## 🖋️ Requête Forum"))
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent("La requête forum a correctement été envoyée !"),
      );

    sendTemporaryError(interaction, userContainer);
  },
};
