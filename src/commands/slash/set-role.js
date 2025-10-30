const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getData, saveData } = require("../../../util/module/getAndSaveData");
const {
  errorStaffContainer,
  discordStaff,
} = require("../../../util/module/discordLink");

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
