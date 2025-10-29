const {
  SlashCommandBuilder,
  MessageFlags,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getData } = require("../../../util/module/getAndSaveData");
const { containerSingle } = require("../../../util/container/configSingle");
const { containerMultiple } = require("../../../util/container/configMultiple");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Affiche la configuration d’un système")
    .addStringOption((option) =>
      option
        .setName("serveur")
        .setDescription("Le serveur pour lequel afficher la configuration")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Le type de configuration à afficher")
        .setRequired(true)
        .addChoices(
          { name: "Attente Staff", value: "attentestaff" },
          { name: "Disband", value: "disband" },
          { name: "Double Lead", value: "doublelead" },
          { name: "Expansion Territoriale", value: "expansionterritoriale" },
          { name: "Forum", value: "forum" },
          { name: "Jail", value: "jail" },
          { name: "Notation", value: "notation" },
          { name: "ONU", value: "onu" },
          { name: "NGRadio", value: "radio" },
          { name: "Récapitulatif", value: "recap" },
          { name: "Routine", value: "routine" },
          { name: "Staff", value: "staff" },
        ),
    ),

  async execute(client, interaction, config) {
    const serveur = interaction.options.getString("serveur").toLowerCase();

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

    const type = interaction.options.getString("type").toLowerCase();

    const typeMap = {
      attentestaff: "Attente Staff",
      disband: "Disband",
      doublelead: "Double Lead",
      expansionterritoriale: "Expansion Territoriale",
      forum: "Forum",
      jail: "Jail",
      notation: "Notation",
      onu: "ONU",
      radio: "NGRadio",
      recap: "Récapitulatif",
      routine: "Routine",
      staff: "Staff",
    };

    const configData = getData(`data/${serveur}/config-${type}.json`);
    const keys = Object.keys(configData);

    if (keys.length === 1) {
      const systemName = keys[0];
      const settings = configData[systemName];
      const container = await containerSingle(
        serveur,
        systemName,
        settings,
        type,
      );

      await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } else {
      const container = await containerMultiple(serveur, type, configData);
      await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  },
};
