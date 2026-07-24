const fs = require("node:fs");
const { discordStaff } = require("../util/module/discordLink");
const ServeurDiscord = require("../util/database/models/ServeurDiscord");

async function getServerCommand(guildId, userId) {
  const { servers } = await discordStaff(userId, "all", "guide");
  if (servers.length === 1) return servers;
  if (!guildId) return [];
  const guildData = await ServeurDiscord.findOne({ guildId: guildId });
  if (guildData && servers.includes(guildData.serveur))
    return [guildData.serveur];
  if (servers.length >= 1) return servers;
  else return [];
}

module.exports = getServerCommand;
