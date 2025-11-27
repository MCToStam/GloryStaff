const { discordStaff } = require("../../../util/module/discordLink");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config");

module.exports = async (client, member) => {
  try {
    const guildId = member.guild.id;
    if (guildId !== config.support_serveur_id) return;

    const memberId = member.user.id;

    const {
      pseudonym,
      servers: availableServers,
      container,
    } = await discordStaff(memberId, "all", "super_moderateur");

    const rolesToAdd = availableServers
      .map((server) => config.role[server])
      .filter((roleId) => roleId);

    if (rolesToAdd.length > 0) {
      await member.roles.add(rolesToAdd);
      console.log(
        `Ajout des rôles ${rolesToAdd} à ${member.user.displayName} automatiquement.`,
      );
      try {
        const embed = new EmbedBuilder()
          .setColor(config.color)
          .setTitle(`Bienvenue ${member.user.displayName}`)
          .setDescription(
            `Merci d'avoir rejoint le serveur support de GloryBot et de GloryStaff. Le rôle d'opérateur de ${availableServers.length > 1 ? "tes" : "ton"} serveur${availableServers.length > 1 ? "s" : ""} t'a automatiquement été donné en raison de ton implication dans ce${availableServers.length > 1 ? "s" : ""} serveur${availableServers.length > 1 ? "s" : ""} : ${availableServers.join(
              ", ",
            )}.\n\nPour t'aider, voici un petit guide des salons mis à disposition :\n- <#1327555365436653568> : Fait-nous part de l'intégralité de tes envies et demandes d'ajouts\n- <#1327555147785572362> : Remonte-nous les problèmes que tu peux rencontrer\n- <#1327554503846924311> : Tiens-toi au courant des nouveautés qui arrivent\n\nRappelle-toi aussi que si tu as une question, même banale, n'hésite pas à la poser !`,
          )
          .setFooter({ text: config.footer });

        await member.send({ embeds: [embed] });
      } catch (e) {}
    }
  } catch (error) {
    console.error("Erreur lors du traitement de guildMemberAdd:", error);
  }
};
