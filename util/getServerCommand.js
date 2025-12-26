const fs = require("node:fs");

async function getServerCommand(guildId) {
  if (!guildId) return;
  const rawDatas = fs.readFileSync("data/logo/serveur.json", "utf-8");
  const data = JSON.parse(rawDatas);
  if (data[guildId]) return data[guildId];
  else return;
}

module.exports = { getServerCommand };
