const { getData } = require("../../../util/module/getAndSaveData");
const {
  SlashCommandBuilder,
  ContainerBuilder,
  ActionRowBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dossier-disband")
    .setDescription("Affiche la liste des dossiers disband")
    .addStringOption((option) =>
      option
        .setName("serveur")
        .setDescription("Le serveur pour lequel afficher les dossiers disband")
        .setRequired(true)
        .setAutocomplete(true),
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

    const data = getData(`data/${serveur}/dossierDisband.json`);

    if (!data.length) {
      return interaction.reply({
        content: `Aucun dossier disband n’a été trouvé pour <:NG${
          serveur.charAt(0).toUpperCase() + serveur.slice(1)
        }:${config.emoji[serveur]}> **${
          serveur.charAt(0).toUpperCase() + serveur.slice(1)
        }**.`,
        ephemeral: true,
      });
    }

    const container = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## Dossiers Disband - ${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }`,
        ),
      )
      .addSeparatorComponents((s) => s);

    for (const entry of data) {
      const pays = entry.rapport?.informations?.nom_pays || entry.pays;
      const chef = entry.rapport?.informations?.chef || "Inconnu";

      container.addTextDisplayComponents((text) =>
        text.setContent(
          `[**${pays}**](https://nationsglory.fr/country/${serveur}/${pays}/) créé par [**${chef}**](https://nationsglory.fr/profile/${chef})`,
        ),
      );
    }

    const menuOptions = data.slice(0, 25).map((entry) => {
      const pays = entry.rapport?.informations?.nom_pays || entry.pays;
      return { label: pays, value: `dossierDisbandDetails-${serveur}-${pays}` };
    });

    container.addSeparatorComponents((s) => s);
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("dossierDisbandDetails")
          .setPlaceholder("Sélectionnez un pays")
          .addOptions(menuOptions),
      ),
    );

    return await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
