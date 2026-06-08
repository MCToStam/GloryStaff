const log = require("../../util/module/log");
const { getEmojiDrapeau } = require("../../util/module/emoji");
const {
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextDisplayBuilder,
  MessageFlags,
  ChannelType,
} = require("discord.js");
const Configuration = require("../../util/database/models/Configuration");
const config = require("../../config");

async function classement_notation(client) {
  const weekRes = await fetch(`${config.glorybot_url}/api/notationWeek`);
  const weekJson = await weekRes.json();
  const week = weekJson.semaine;

  const response = await fetch(`${config.glorybot_url}/api/notations/${week}`, {
    headers: {
      Authorization: `Bearer ${config.glorybot_token}`,
    },
  });

  const data = await response.json();
  if (!data?.length) return;

  const sortedData = [...data].sort((a, b) => b.bourse - a.bourse);

  const topCountries = sortedData
    .slice(0, 3)
    .map(
      (entry) =>
        `<:NG${entry.server.charAt(0).toUpperCase()}${entry.server.slice(1)}:${config.emoji[entry.server]}> ${
          entry.pays
        }・${entry.bourse}$`,
    )
    .join("\n");

  for (const serveur of config.liste_serveur) {
    log(`🔎 Classement notations | ${serveur}`, "LOG", "gray");

    const configs = await Configuration.find({
      serveur,
      categorie: "Notations",
      systeme: "Classement",
    });

    for (const classementConfig of configs) {
      if (!classementConfig.active) continue;

      const guild = client.guilds.cache.get(classementConfig.guildId);
      if (!guild) continue;

      const channelId = classementConfig.data.get("Salon");
      if (!channelId) continue;

      const channel = guild.channels.cache.get(channelId);
      if (!channel) continue;

      const roleIds = classementConfig.data.get("Role") || [];
      const roleMentions = roleIds.map((id) => `<@&${id}>`).join(" ");

      const topServerCountriesRaw = sortedData
        .filter((entry) => entry.server === serveur)
        .slice(0, 10);

      const emojis = {};
      for (const entry of topServerCountriesRaw) {
        const pays = entry.pays.toLowerCase();
        emojis[pays] = (await getEmojiDrapeau(client, serveur, pays)) || "🏳️";
      }

      const topServerCountries = topServerCountriesRaw
        .map((entry) => {
          const emoji = emojis[entry.pays.toLowerCase()] || "🏳️";

          return `${emoji} ${entry.pays}・${entry.bourse}$`;
        })
        .join("\n");

      const container = new ContainerBuilder()
        .setAccentColor(config.couleur[serveur])
        .addTextDisplayComponents((t) =>
          t.setContent("## 🏆 Classement des Notations"),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `**Top 3 Inter-Serveur :**\n${topCountries}\n\n**Top 10 ${serveur} :**\n${topServerCountries}`,
          ),
        )
        .addSeparatorComponents((s) => s)
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("notation_help")
              .setLabel("Informations")
              .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
              .setCustomId(`notation_op-${week}`)
              .setLabel("Qui note mon pays ?")
              .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
              .setLabel("Page des Notations")
              .setURL(`https://nationsglory.fr/notations/${serveur}/${week}`)
              .setStyle(ButtonStyle.Link),
          ),
        );

      const components = [];

      if (roleMentions.length > 0) {
        components.push(new TextDisplayBuilder().setContent(roleMentions));
      }

      components.push(container);

      try {
        const sentMessage = await channel.send({
          components,
          flags: MessageFlags.IsComponentsV2,
        });

        if (channel.type === ChannelType.GuildNews) {
          await sentMessage.crosspost().catch(() => {});
        }

        log(
          `✅ Classement envoyé | ${serveur} | ${classementConfig.guildId}`,
          "LOG",
          "gray",
        );
      } catch (err) {
        console.error(`❌ Erreur envoi classement | ${serveur}`, err);
      }
    }
  }
}

module.exports = { classement_notation };
