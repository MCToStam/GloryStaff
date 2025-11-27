const { discordStaff } = require("../util/module/discordLink");
const config = require("../config");

async function checkGradeSupport(client) {
  try {
    const supportGuild = client.guilds.cache.get(config.support_serveur_id);
    if (!supportGuild) {
      console.error(
        "[updateStaffRoles] Impossible de trouver le serveur support.",
      );
      return;
    }

    await supportGuild.members.fetch();

    for (const member of supportGuild.members.cache.values()) {
      if (member.user.bot) continue;

      try {
        const { servers: availableServers } = await discordStaff(
          member.id,
          "all",
          "super_moderateur",
        );

        const expectedRoles = availableServers
          .map((server) => config.role[server])
          .filter((roleId) => roleId);

        const currentRoles = member.roles.cache
          .filter((r) => Object.values(config.role).includes(r.id))
          .map((r) => r.id);

        const rolesToAdd = expectedRoles.filter(
          (role) => !currentRoles.includes(role),
        );
        const rolesToRemove = currentRoles.filter(
          (role) => !expectedRoles.includes(role),
        );

        if (rolesToAdd.length > 0 || rolesToRemove.length > 0) {
          await member.roles.add(rolesToAdd).catch(() => {});
          await member.roles.remove(rolesToRemove).catch(() => {});
          console.log(
            `[updateStaffRoles] Mise à jour des rôles de ${member.user.tag} : +${rolesToAdd}, -${rolesToRemove}.`,
          );
        }
      } catch (e) {
        console.error(
          `[updateStaffRoles] Erreur avec le membre ${member.user.tag}:`,
          e,
        );
      }
    }

    console.log("[updateStaffRoles] Vérification terminée.");
  } catch (error) {
    console.error("[updateStaffRoles] Erreur générale :", error);
  }
}

module.exports = { checkGradeSupport };
