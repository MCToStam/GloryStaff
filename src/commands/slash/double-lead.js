const { getData } = require("../../../util/module/getAndSaveData");
const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("double-lead")
    .setDescription("Affiche la liste des doubles lead")
    .addStringOption((option) =>
      option
        .setName("serveur")
        .setDescription(
          "Le serveur pour lequel afficher la liste des doubles lead",
        )
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

    const data = getData(`data/doublelead.json`);

    const matchingLeaders = data.filter((entry) =>
      Object.keys(entry.servers).some(
        (server) => server.toLowerCase() === serveur,
      ),
    );

    if (matchingLeaders.length === 0) {
      const noDoubleLead = new ContainerBuilder()
        .setAccentColor(config.couleur[serveur])
        .addTextDisplayComponents((t) =>
          t.setContent(
            `## Double Lead - ${
              serveur.charAt(0).toUpperCase() + serveur.slice(1)
            }`,
          ),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `Aucun double lead n'a été trouvé sur le serveur <:NG${
              serveur.charAt(0).toUpperCase() + serveur.slice(1)
            }:${config.emoji[serveur.toLowerCase()]}> **${
              serveur.charAt(0).toUpperCase() + serveur.slice(1)
            }**.`,
          ),
        );
      return await interaction.reply({
        components: [noDoubleLead],
        flags: MessageFlags.IsComponentsV2,
        ephemeral: true,
      });
    }

    const containerDoubleLead = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## Double Lead - ${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }`,
        ),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          matchingLeaders
            .map((entry) => {
              let serverList = "";
              Object.keys(entry.servers).forEach((serverName) => {
                const countryName = entry.servers[serverName];
                serverList += `↪ <:NG${
                  serverName.charAt(0).toUpperCase() + serverName.slice(1)
                }:${config.emoji[serverName]}> ${
                  serverName.charAt(0).toUpperCase() + serverName.slice(1)
                } : ${countryName}\n`;
              });
              return `**${entry.leader.replace(
                /_/g,
                "\\_",
              )} :**\n${serverList}`;
            })
            .join("\n"),
        ),
      );

    return await interaction.reply({
      components: [containerDoubleLead],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true,
    });
  },
};
