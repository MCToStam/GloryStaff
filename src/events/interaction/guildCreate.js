const { AuditLogEvent } = require("discord.js");
const { getData } = require("../../../util/module/getAndSaveData");
const config = require("../../../config");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

module.exports = async (client, guild) => {
  try {
    const auditLogs = await guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.BotAdd,
    });
    const botAddLog = auditLogs.entries.find(
      (entry) => entry.target.id === client.user.id,
    );
    const inviter = botAddLog?.executor;
    const targetUserID = "719072181631320145";
    const targetUser = await client.users.fetch(targetUserID);

    const escapedServerName = guild.name.replace(/_/g, "\\_");
    const creationTimestamp = Math.floor(guild.createdTimestamp / 1000);
    const serverIconURL = guild.iconURL({ dynamic: true, size: 512 });

    let isAuthorized = false;

    for (const serveur of config.liste_serveur) {
      const staffData = getData(`data/${serveur}/staff.json`);

      const isStaff = Object.values(staffData).some((ids) =>
        ids.includes(inviter?.id),
      );

      if (isStaff) {
        isAuthorized = true;
        break;
      }
    }

    if (config.developpeur.includes(inviter?.id) || isAuthorized) {
      const embed = {
        title: "Nouveau Serveur - Accès Autorisé",
        description: `GloryStaff a été invité par <@${inviter.id}>.\n\n> Nom : ${escapedServerName}\n> Membres : ${guild.memberCount}\n> Propriétaire : <@${guild.ownerId}>\n> Date de création : <t:${creationTimestamp}:R>`,
        thumbnail: { url: serverIconURL },
        footer: { text: config.footer },
        color: config.goodcolor,
      };
      try {
        await targetUser.send({ embeds: [embed] });
      } catch (e) {}
      console.log(
        `Le bot a été ajouté par ${inviter?.tag} dans un serveur autorisé : ${guild.name}`,
      );
    } else {
      const embed = {
        title: "Nouveau Serveur - Accès Refusé",
        description: `GloryStaff a été invité par <@${inviter.id}>.\n\n> Nom : ${escapedServerName}\n> Membres : ${guild.memberCount}\n> Propriétaire : <@${guild.ownerId}>\n> Date de création : <t:${creationTimestamp}:R>`,
        thumbnail: { url: serverIconURL },
        footer: { text: config.footer },
        color: config.errorcolor,
      };

      const dmEmbed = new EmbedBuilder()
        .setTitle("Accès Refusé")
        .setDescription(
          "GloryStaff est un robot uniquement disponible aux différents staffs de NationsGlory, il est donc formellement interdit de l'inviter sur un autre serveur Discord que ceux autorisés. Néanmoins, GloryBot est un robot accessible aux joueurs afin de vous aider dans votre parcours sur NationsGlory.",
        )
        .setFooter({ text: config.footer })
        .setColor(config.errorcolor);

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Inviter GloryBot")
          .setURL(
            "https://discord.com/oauth2/authorize?client_id=829422257130176523",
          )
          .setStyle(ButtonStyle.Link)
          .setEmoji("1360717989267378477"),
      );
      try {
        await targetUser.send({ embeds: [embed] });
      } catch (e) {}
      try {
        await inviter.send({ embeds: [dmEmbed], components: [actionRow] });
      } catch (e) {}
      console.log(
        `Le bot a été ajouté par ${inviter?.tag} dans un serveur non autorisé : ${guild.name}`,
      );
      await guild.leave();
    }
  } catch (error) {
    console.error(
      `Erreur lors de la vérification pour le serveur ${guild.name}:`,
      error,
    );
    await guild.leave();
  }
};
