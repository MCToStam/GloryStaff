const { AuditLogEvent } = require("discord.js");
const { discordStaff } = require("../../../util/module/discordLink");
const config = require("../../../config");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ContainerBuilder,
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

    const escapedServerName = guild.name
      .replace(/\\/g, "\\\\")
      .replace(/_/g, "\\_");
    const creationTimestamp = Math.floor(guild.createdTimestamp / 1000);
    const serverIconURL = guild.iconURL({ dynamic: true, size: 512 });

    const { pseudonym, servers, container } = await discordStaff(
      inviter?.id,
      "all",
      "guide",
    );

    if (config.developpeur.includes(inviter?.id) || servers.length > 0) {
      const container = new ContainerBuilder()
        .setAccentColor(config.colors.success)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent("## ✅ Nouveau Serveur - Accès Autorisé"),
        )
        .addSeparatorComponents((separator) => separator);

      if (serverIconURL) {
        container.addSectionComponents((section) =>
          section
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent(
                `GloryStaff a été invité par <@${inviter.id}>.\n\n> Nom : ${escapedServerName}\n> Membres : ${guild.memberCount}\n> Propriétaire : <@${guild.ownerId}>\n> Date de création : <t:${creationTimestamp}:R>`,
              ),
            )
            .setThumbnailAccessory((thumbnail) =>
              thumbnail.setURL(serverIconURL),
            ),
        );
      } else {
        container.addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            `GloryStaff a été invité par <@${inviter.id}>.\n\n> Nom : ${escapedServerName}\n> Membres : ${guild.memberCount}\n> Propriétaire : <@${guild.ownerId}>\n> Date de création : <t:${creationTimestamp}:R>`,
          ),
        );
      }

      try {
        await targetUser.send({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      } catch (e) {}
    } else {
      let errorContainer;
      if (!pseudonym) {
        errorContainer = new ContainerBuilder()
          .setAccentColor(config.colors.error)
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent("## ❌ Compte non Lié"),
          )
          .addSeparatorComponents((separator) => separator)
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              "Ton compte Discord doit être lié à ton compte NationsGlory pour effectuer cette action.",
            ),
          )
          .addSeparatorComponents((separator) => separator)
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel("🔗 Lier son Compte")
                .setURL("https://glorybot.fr/user/profile")
                .setStyle(ButtonStyle.Link),
            ),
          );
      } else {
        errorContainer = new ContainerBuilder()
          .setAccentColor(config.colors.error)
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent("## ❌ Accès Refusé"),
          )
          .addSeparatorComponents((separator) => separator)
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              "GloryStaff est un robot uniquement disponible aux différents staffs de NationsGlory, il est donc formellement interdit de l'inviter sur un autre serveur Discord que ceux autorisés. Néanmoins, GloryBot est un robot accessible aux joueurs afin de vous aider dans votre parcours sur NationsGlory.",
            ),
          )
          .addSeparatorComponents((separator) => separator)
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel("🔗 Inviter GloryBot")
                .setURL(
                  "https://discord.com/oauth2/authorize?client_id=829422257130176523",
                )
                .setStyle(ButtonStyle.Link),
            ),
          );
      }

      const container = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent("## ❌ Nouveau Serveur - Accès Refusé"),
        )
        .addSeparatorComponents((separator) => separator)
        .addSectionComponents((section) =>
          section
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent(
                `GloryStaff a été invité par <@${inviter.id}>.\n\n> Nom : ${escapedServerName}\n> Membres : ${guild.memberCount}\n> Propriétaire : <@${guild.ownerId}>\n> Date de création : <t:${creationTimestamp}:R>`,
              ),
            )
            .setThumbnailAccessory((thumbnail) =>
              thumbnail.setURL(serverIconURL),
            ),
        );

      try {
        await targetUser.send({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      } catch (e) {}
      try {
        await inviter.send({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      } catch (e) {}
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
