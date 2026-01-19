const { discordStaff } = require("../util/module/discordLink");
const config = require("../config");

async function checkGradeSupport(client) {
  try {
    console.log("[updateStaffRoles] Début de la vérification.");
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
        const { pseudonym, servers: adminServers } = await discordStaff(
          member.id,
          "all",
          "administrateur",
        );

        if (!pseudonym) continue;

        const { servers: superModoServers } = await discordStaff(
          member.id,
          "all",
          "super_moderateur",
        );

        const { servers: guideServers } = await discordStaff(
          member.id,
          "all",
          "guide",
        );

        const expectedRoles = [];

        if (adminServers.length > 0 && config.role["administrateur"]) {
          expectedRoles.push(config.role["administrateur"]);
        } else if (
          superModoServers.length > 0 &&
          config.role["super_moderateur"]
        ) {
          expectedRoles.push(config.role["super_moderateur"]);
        }

        if (guideServers.length > 0 && config.role["staffng"]) {
          expectedRoles.push(config.role["staffng"]);
        }

        const serverRoles = guideServers
          .map((server) => config.role[server])
          .filter(Boolean);

        expectedRoles.push(...serverRoles);

        const managedRoles = Object.values(config.role);

        const currentRoles = member.roles.cache
          .filter((r) => managedRoles.includes(r.id))
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
