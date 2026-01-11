const fs = require("node:fs");
const { discordStaff } = require("../util/module/discordLink");

async function getServerCommand(guildId, userId) {
  const { servers } = await discordStaff(userId, "all", "guide");
  if (servers.length === 1) return servers[0];
  if (!guildId) return;
  const rawDatas = fs.readFileSync("data/logo/serveur.json", "utf-8");
  const data = JSON.parse(rawDatas);
  if (data[guildId] && servers.includes(data[guildId])) return data[guildId];
  if (servers.length >= 1) return servers;
  else return;
}

module.exports = getServerCommand;
