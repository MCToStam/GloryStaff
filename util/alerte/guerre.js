const config = require("../../config");
const { getData, saveData } = require("../../util/module/getAndSaveData");
const { Guerre, Guerrenontraitée } = require("../../util/container/module");
const cheerio = require("cheerio");
const { DateTime } = require("luxon");
const { MessageFlags, TextDisplayBuilder } = require("discord.js");

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
      if (!forumConfig.Guerre.Forum) continue;

      await new Promise((res) => setTimeout(res, 5000));

      let complaints = [];
      try {
        const data = await (await fetch(forumConfig.Guerre.Forum)).text();
        const $ = cheerio.load(data);

        complaints = $("tr")
          .map((i, el) => {
            if (!$(el).find(".badge").text().includes("En Attente"))
              return null;

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
              missingCount: 0,
              message: [],
              alerteEnvoyee: {},
            };
          })
          .get()
          .filter((c) => c?.titre && c?.lien && c?.date);
      } catch (err) {
        console.error("Erreur fetch guerres :", err);
        continue;
      }

      const guerresExistantes = getData(`data/${server}/forum/guerre.json`);

      for (const guerre of guerresExistantes) {
        const stillExists = complaints.some((c) => c.lien === guerre.lien);

        if (stillExists) {
          guerre.missingCount = 0;
        } else {
          guerre.missingCount = guerre.missingCount + 1;
        }
      }

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
            const container = await Guerre(client, server, guerre);

            let components = container;
            if (roleMentions && !rolePingDone[guildId])
              components = [
                new TextDisplayBuilder().setContent(roleMentions),
                ...container,
              ];

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
      }

      guerresExistantes.push(...nouvellesGuerres);

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
          const container = await Guerrenontraitée(
            client,
            server,
            guerre,
            delaiJour,
          );

          let components = container;
          if (roleMentions && !rolePingDone)
            components = [
              new TextDisplayBuilder().setContent(roleMentions),
              ...container,
            ];

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

          guerre.alerteEnvoyee[guildId] = true;
          rolePingDone = true;
        }
      }

      for (const guerre of guerresExistantes.filter(
        (g) =>
          !complaints.some((c) => c.lien === g.lien) && g.missingCount >= 12,
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

      saveData(
        `data/${server}/forum/guerre.json`,
        guerresExistantes.filter((p) => p.missingCount < 13),
      );
    } catch (e) {
      console.log(`Erreur Guerre ${server} :`, e);
    }
  }
}

module.exports = { guerre };
