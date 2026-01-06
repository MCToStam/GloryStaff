const config = require("../../config");
const { getData, saveData } = require("../../util/module/getAndSaveData");
const { getEmojiTete } = require("../../util/module/emoji");
const cheerio = require("cheerio");
const { DateTime } = require("luxon");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
} = require("discord.js");

const moisMapping = {
  janvier: "01",
  février: "02",
  mars: "03",
  avril: "04",
  mai: "05",
  juin: "06",
  juillet: "07",
  août: "08",
  septembre: "09",
  octobre: "10",
  novembre: "11",
  décembre: "12",
};

function convertirEnTimestamp(dateStr) {
  const now = DateTime.now().setZone("Europe/Paris");
  const relativeMatch = dateStr.match(/Il y a (\d+) (minute|heure|jour)s?/);

  if (relativeMatch) {
    const [_, value, unit] = relativeMatch;
    const timeUnit = { minute: "minutes", heure: "hours", jour: "days" }[unit];
    return Math.floor(now.minus({ [timeUnit]: parseInt(value) }).toSeconds());
  }

  const match = dateStr
    .replace(/.*le\s+/, "")
    .trim()
    .replace(/\u00A0|\u202F/g, " ")
    .match(/(\d{1,2}) ([\p{L}éûàç]+) (\d{4}) à (\d{1,2}):(\d{2})/u);

  if (!match) return null;

  const [, jour, moisTexte, annee, heure, minute] = match;
  const mois = moisMapping[moisTexte.toLowerCase()];
  if (!mois) return null;

  return Math.floor(
    DateTime.fromObject(
      { year: +annee, month: +mois, day: +jour, hour: +heure, minute: +minute },
      { zone: "Europe/Paris" },
    ).toSeconds(),
  );
}

async function guerre(client) {
  for (const server of config.liste_serveur) {
    try {
      const allConfig = getData(`data/${server}/config.json`);
      const configData = allConfig.find((c) => c.nom === "Forum");

      const forumConfig = configData.systeme;

      await new Promise((res) => setTimeout(res, 5000));

      const data = await (await fetch(forumConfig.Guerre.Forum)).text();
      const $ = cheerio.load(data);

      const complaints = $("tr")
        .map((i, el) => {
          if (!$(el).find(".badge").text().includes("En Attente")) return null;

          const titleEl = $(el).find("th a.stretched-link").first();
          const dateStr = $(el)
            .find("span.small.text-muted")
            .filter((_, m) => $(m).text().includes("Posté"))
            .last()
            .text();

          return {
            titre: titleEl.text().trim(),
            lien: `https://nationsglory.fr${titleEl.attr("href")}`,
            auteur: $(el)
              .find("a.text-muted.stretched-link.position-relative")
              .first()
              .text()
              .trim(),
            date: convertirEnTimestamp(dateStr),
            message: [],
          };
        })
        .get()
        .filter((c) => c?.titre && c?.lien && c?.date);

      const guerresExistantes = getData(`data/${server}/forum/guerre.json`);
      const guerresAvantUpdate = [...guerresExistantes];

      const nouvellesGuerres = complaints.filter(
        (c) => !guerresExistantes.some((p) => p.lien === c.lien),
      );

      if (nouvellesGuerres.length) {
        let rolePingDone = {};

        for (const [guildId, isActive] of Object.entries(
          forumConfig.Guerre.active,
        )) {
          if (!isActive) continue;

          const guild = client.guilds.cache.get(guildId);
          if (!guild) continue;

          const channelId = forumConfig.Guerre.Salon?.valeur?.[guildId];
          if (!channelId) continue;

          const channel = guild.channels.cache.get(channelId);
          if (!channel) continue;

          const roleIds = forumConfig.Guerre.Role?.valeur?.[guildId] || [];
          const roleMentions = roleIds.map((id) => `<@&${id}>`).join(" ");

          for (const guerre of nouvellesGuerres) {
            const emoji = await getEmojiTete(client, guerre.auteur);

            const container = new ContainerBuilder()
              .setAccentColor(config.couleur[server])
              .addTextDisplayComponents((t) =>
                t.setContent(`## 📍 Nouvelle Guerre`),
              )
              .addSeparatorComponents((s) => s)
              .addTextDisplayComponents((t) =>
                t.setContent(
                  `📌 **Titre :** ${guerre.titre}\n${emoji} **Auteur :** ${guerre.auteur}\n\n*Postée <t:${guerre.date}:R>*`,
                ),
              )
              .addSeparatorComponents((s) => s)
              .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setURL(guerre.lien)
                    .setLabel("🔗 Aller sur la Guerre")
                    .setStyle(ButtonStyle.Link),
                ),
              );

            const components = [container];
            if (roleMentions && !rolePingDone[guildId]) {
              components.push(
                new TextDisplayBuilder().setContent(roleMentions),
              );
            }

            let sent;
            try {
              sent = await channel.send({
                components,
                flags: MessageFlags.IsComponentsV2,
              });

              if (channel.type === "GUILD_NEWS")
                await sent.crosspost().catch(() => {});

              console.log(
                `✅ Message guerre envoyé | serveur ${server} | guild ${guildId}`,
              );
            } catch (err) {
              console.error(
                `❌ Erreur envoi nouvelle guerre | serveur ${server} | guild ${guildId}`,
                err,
              );
            }

            rolePingDone[guildId] = true;
            guerre.message.push({
              guildId,
              channelId: channel.id,
              messageId: sent.id,
            });
          }
        }

        guerresExistantes.push(...nouvellesGuerres);
        saveData(`data/${server}/forum/guerre.json`, guerresExistantes);
      }

      const guerreNonTraiteeConfig = forumConfig["Guerre non traitée"];

      for (const [guildId, isActive] of Object.entries(
        guerreNonTraiteeConfig.active,
      )) {
        if (!isActive) continue;

        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;

        const channelId = guerreNonTraiteeConfig.Salon?.valeur?.[guildId];
        if (!channelId) continue;

        const channel = guild.channels.cache.get(channelId);
        if (!channel) continue;

        const delaiJour = Number(
          guerreNonTraiteeConfig.Temps?.valeur?.[guildId],
        );
        if (!delaiJour) continue;

        const roleIds = guerreNonTraiteeConfig.Role?.valeur?.[guildId] || [];
        const roleMentions = roleIds.map((id) => `<@&${id}>`).join(" ");

        const timestampLimite = Math.floor(
          DateTime.now().minus({ days: delaiJour }).toSeconds(),
        );

        let rolePingDone = false;

        for (const guerre of guerresExistantes.filter(
          (g) => g.date < timestampLimite && !g?.alerteEnvoyee?.[guildId],
        )) {
          const emoji = await getEmojiTete(client, guerre.auteur);

          const container = new ContainerBuilder()
            .setAccentColor(config.couleur[server])
            .addTextDisplayComponents((t) =>
              t.setContent(`## 🚨 Guerre non traitée`),
            )
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((t) =>
              t.setContent(
                `📌 **Titre :** ${guerre.titre}\n${emoji} **Auteur :** ${guerre.auteur}\n\n*Postée depuis plus de ${delaiJour} jour(s)*`,
              ),
            )
            .addSeparatorComponents((s) => s)
            .addActionRowComponents(
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setURL(guerre.lien)
                  .setLabel("🔗 Aller sur la Guerre")
                  .setStyle(ButtonStyle.Link),
              ),
            );

          const components = [container];
          if (roleMentions && !rolePingDone) {
            components.push(new TextDisplayBuilder().setContent(roleMentions));
          }

          try {
            await channel.send({
              components,
              flags: MessageFlags.IsComponentsV2,
            });

            console.log(
              `✅ Alerte guerre non traitée | serveur ${server} | guild ${guildId}`,
            );
          } catch (err) {
            console.error(
              `❌ Erreur alerte guerre non traitée | serveur ${server} | guild ${guildId}`,
              err,
            );
            continue;
          }

          guerre.alerteEnvoyee ??= {};
          guerre.alerteEnvoyee[guildId] = true;
          rolePingDone = true;
        }
      }

      saveData(`data/${server}/forum/guerre.json`, guerresExistantes);

      for (const guerre of guerresAvantUpdate.filter(
        (g) => !complaints.some((c) => c.lien === g.lien),
      )) {
        if (!Array.isArray(guerre.message)) continue;

        for (const { channelId, messageId } of guerre.message) {
          try {
            const channel = await client.channels
              .fetch(channelId)
              .catch(() => null);
            if (!channel?.isTextBased()) continue;

            const message = await channel.messages
              .fetch(messageId)
              .catch(() => null);
            if (!message?.deletable) continue;

            await message.delete();
            console.log(
              `🗑️ Message guerre supprimé | channel ${channelId} | message ${messageId}`,
            );
          } catch (err) {
            console.error(
              `❌ Erreur suppression message guerre (${messageId})`,
              err,
            );
          }
        }
      }

      if (guerresAvantUpdate.length > 0) {
        const guerresRestantes = guerresExistantes.filter((g) =>
          complaints.some((c) => c.lien === g.lien),
        );

        saveData(`data/${server}/forum/guerre.json`, guerresRestantes);
      }
    } catch (e) {}
  }
}

module.exports = { guerre };
