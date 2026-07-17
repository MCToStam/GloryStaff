const { discordStaff } = require("../../../util/module/discordLink");
const log = require("../../../util/module/log");
const { ContainerBuilder, MessageFlags } = require("discord.js");
const config = require("../../../config");

module.exports = async (client, member) => {
  try {
    if (member.guild.id !== config.support_serveur_id) return;

    const { servers: adminServers } = await discordStaff(
      member.user.id,
      "all",
      "administrateur",
    );

    const { servers: superModoServers } = await discordStaff(
      member.user.id,
      "all",
      "super_moderateur",
    );

    const { servers: guideServers } = await discordStaff(
      member.user.id,
      "all",
      "guide",
    );

    const rolesToAdd = [];

    if (adminServers.length > 0 && config.role["administrateur"]) {
      rolesToAdd.push(config.role["administrateur"]);
    } else if (superModoServers.length > 0 && config.role["super_moderateur"]) {
      rolesToAdd.push(config.role["super_moderateur"]);
    }

    if (guideServers.length > 0 && config.role["staffng"]) {
      rolesToAdd.push(config.role["staffng"]);
    }

    const serverRoles = guideServers
      .map((server) => config.serveur[server].role)
      .filter(Boolean);

    rolesToAdd.push(...serverRoles);

    if (rolesToAdd.length === 0) return;

    await member.roles.add(rolesToAdd);

    log(
      `✅ Ajout des rôles ${rolesToAdd.join(", ")} à ${member.user.displayName} automatiquement.`,
      "LOG",
      "gray",
    );

    const container = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(`## 👋 Bienvenue ${member.user.displayName}`),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `Merci d'avoir rejoint le serveur support de GloryBot et GloryStaff.\n\n` +
            `Ton rôle t'a été attribué automatiquement en fonction de ton implication sur les serveurs suivants :\n` +
            `${guideServers.join(", ")}\n\n` +
            `📌 Besoin d'aide ? N'hésite jamais à poser une question !`,
        ),
      );

    try {
      await member.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (e) {}
  } catch (error) {
    console.error("Erreur lors du traitement de guildMemberAdd:", error);
  }
};
