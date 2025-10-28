const { SlashCommandBuilder } = require("discord.js");
const { getData, saveData } = require("../../../util/module/getAndSaveData");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("set-role")
    .setDescription(
      "Attribue un rôle à un utilisateur pour un serveur spécifique",
    )
    .addStringOption((option) =>
      option
        .setName("serveur")
        .setDescription("Le serveur pour lequel afficher la liste des staffs")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addUserOption((option) =>
      option
        .setName("membre")
        .setDescription("Le membre à qui attribuer un grade")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("role")
        .setDescription("Le rôle à attribuer")
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async execute(client, interaction, config) {
    const membre = interaction.options.getUser("membre");
    const grade = interaction.options.getString("role");
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

    const guild = interaction.guild;
    const member = guild.members.cache.get(membre.id);

    const supportGuild = await client.guilds.fetch(config.support_serveur_id);
    const isInSupportServer = await supportGuild.members
      .fetch(membre.id)
      .catch(() => null);

    const roleId = config.role[serveur.toLowerCase()];
    const couleur = config.couleur[serveur.toLowerCase()];
    const role = supportGuild.roles.cache.get(roleId);

    if (member.roles.cache.has(roleId) && grade != "Joueur") {
      const RoleEmbed = {
        title: "Erreur",
        description: `<@${membre.id}> fait déjà partis du staff opérateur du serveur <:NG${capitalizedServeur}:${emojiId}> **${capitalizedServeur}**.`,
        color: config.errorcolor,
        footer: { text: config.footer },
      };
      return interaction.reply({ embeds: [RoleEmbed], ephemeral: true });
    }

    const validGrades = ["Administrateur", "Super-Modérateur", "Joueur"];
    if (!validGrades.includes(grade)) {
      return interaction.reply({
        embeds: [
          {
            title: "Erreur",
            description: "Le grade spécifié n'est pas valide.",
            color: config.errorcolor,
            footer: { text: config.footer },
          },
        ],
        ephemeral: true,
      });
    }

    if (!staffData[grade] && grade !== "Joueur") {
      staffData[grade] = [];
    }
    if (grade !== "Joueur") {
      if (!staffData[grade].includes(membre.id)) {
        staffData[grade].push(membre.id);
      }
    }

    if (grade === "Joueur") {
      const gradesToRemove = ["Administrateur", "Super-Modérateur"];
      gradesToRemove.forEach((g) => {
        if (staffData[g]) {
          const index = staffData[g].indexOf(membre.id);
          if (index !== -1) {
            staffData[g].splice(index, 1);
          }
        }
      });

      if (isInSupportServer) {
        await isInSupportServer.roles.remove(role);
      }
    } else {
      if (isInSupportServer) {
        await isInSupportServer.roles.add(role);
      }
    }

    saveData(`data/${serveur}/staff.json`, staffData);

    const embed = {
      title: "Staff Ajouté",
      description: `<@${membre.id}> hérite maintenant du rôle de **${grade}** sur le serveur <:NG${capitalizedServeur}:${emojiId}> **${capitalizedServeur}**.`,
      color: couleur,
      footer: { text: config.footer },
    };

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
