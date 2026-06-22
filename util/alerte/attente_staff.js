const {
  WebhookClient,
  MessageFlags,
  TextDisplayBuilder,
  ChannelType,
} = require("discord.js");
const { getClient } = require("../../util/client");
const { AttenteStaff } = require("../../util/container/module");
const CONFIG_STATIC = require("../../util/config");
const Configuration = require("../../util/database/models/Configuration");
const log = require("../../util/module/log");

async function sendAttenteStaff(serveur, joueur, id) {
  const client = getClient();
  if (!client) return;
  const configAttenteStaff = await Configuration.find({
    serveur,
    categorie: "Attente Staff",
    systeme: "Attente Staff",
  });

  let { components } = await AttenteStaff(client, serveur, joueur, id);

  for (const configuration of configAttenteStaff) {
    if (!configuration.active) continue;

    const guildId = configuration.guildId;
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    const channelId = configuration.data.get("Salon");
    if (!channelId) continue;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) continue;

    const roleIds = configuration.data.get("Role") || [];
    const roleMentions = roleIds.map((id) => `<@&${id}>`).join(" ");

    if (roleMentions.length > 0)
      components = [
        new TextDisplayBuilder().setContent(roleMentions),
        ...components,
      ];

    try {
      const sentMessage = await channel.send({
        components,
        flags: MessageFlags.IsComponentsV2,
      });

      if (channel.type === ChannelType.GuildNews) await sentMessage.crosspost();

      log(
        `✅ Message attente staff | serveur ${serveur} | guild ${guildId}`,
        "LOG",
        "gray",
      );
    } catch (err) {
      console.error(
        `❌ Erreur envoi attente staff 18h15 | serveur ${serveur} | guild ${guildId}`,
        err,
      );
    }
  }
}

module.exports = sendAttenteStaff;
