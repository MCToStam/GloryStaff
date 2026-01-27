const config = require("../../config");
const { getData, saveData } = require("../../util/module/getAndSaveData");
const { Plainte, Plaintenontraitée } = require("../../util/container/module");
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

async function plainte(client) {
  for (const server of config.liste_serveur) {
    try {
      const allConfig = getData(`data/${server}/config.json`);
      const configData = allConfig.find((c) => c.nom === "Forum");
      const plainteConfig = configData.systeme;
      if (!plainteConfig.Plainte.Forum) continue;
      await new Promise((res) => setTimeout(res, 5000));

      let complaints = [];
      try {
        const data = await (await fetch(plainteConfig.Plainte.Forum)).text();
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
        console.error("Erreur fetch plaintes :", err);
      }

      const plaintesExistantes = getData(`data/${server}/forum/plainte.json`);
      const nouvellesPlaintes = complaints.filter(
        (c) => !plaintesExistantes.some((p) => p.lien === c.lien),
      );

      for (const plainte of plaintesExistantes) {
        const stillExists = complaints.some((c) => c.lien === plainte.lien);

        if (stillExists) {
          plainte.missingCount = 0;
        } else {
          plainte.missingCount = plainte.missingCount + 1;
        }
      }

      if (nouvellesPlaintes.length) {
        let rolePingDone = {};

        for (const [guildId, isActive] of Object.entries(
          plainteConfig.Plainte.active,
        )) {
          if (!isActive) continue;

          const guild = client.guilds.cache.get(guildId);
          if (!guild) continue;

          const channelId = plainteConfig.Plainte.Salon.valeur[guildId];
          if (!channelId) continue;

          const channel = guild.channels.cache.get(channelId);
          if (!channel) continue;

          const roleIds = plainteConfig.Plainte.Role.valeur[guildId] || [];
          const roleMentions = roleIds.map((id) => `<@&${id}>`).join(" ");

          for (const plainte of nouvellesPlaintes) {
            const container = await Plainte(client, server, plainte);

            let components = container;
            if (roleMentions && !rolePingDone[guildId])
              components = [
                new TextDisplayBuilder().setContent(roleMentions),
                ...container,
              ];

            let sentMessage;
            try {
              sentMessage = await channel.send({
                components,
                flags: MessageFlags.IsComponentsV2,
              });

              if (channel.type === "GUILD_NEWS") await sentMessage.crosspost();

              console.log(
                `✅ Message plainte envoyé | serveur ${server} | guild ${guildId}`,
              );
            } catch (err) {
              console.error(
                `❌ Erreur envoi nouvelle plainte | serveur ${server} | guild ${guildId}`,
                err,
              );
            }

            if (!sentMessage) continue;
            rolePingDone[guildId] = true;
            plainte.message.push({
              guildId: channel.guild.id,
              channelId: channel.id,
              messageId: sentMessage.id,
            });
          }
        }
      }

      plaintesExistantes.push(...nouvellesPlaintes);

      const plainteNonTraiteeConfig = plainteConfig["Plainte non traitée"];

      for (const [guildId, isActive] of Object.entries(
        plainteNonTraiteeConfig.active,
      )) {
        if (!isActive) continue;

        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;

        const channelId = plainteNonTraiteeConfig.Salon?.valeur?.[guildId];
        if (!channelId) continue;

        const channel = guild.channels.cache.get(channelId);
        if (!channel) continue;

        const delaiJour = Number(
          plainteNonTraiteeConfig.Temps?.valeur?.[guildId],
        );
        if (!delaiJour) continue;

        const roleIds = plainteNonTraiteeConfig.Role?.valeur?.[guildId] || [];
        const roleMentions = roleIds.map((id) => `<@&${id}>`).join(" ");

        const timestampLimite = Math.floor(
          DateTime.now().minus({ days: delaiJour }).toSeconds(),
        );

        let rolePingDone = {};

        for (const plainte of plaintesExistantes.filter(
          (p) => p.date < timestampLimite && !p?.alerteEnvoyee?.[guildId],
        )) {
          const container = await Plaintenontraitée(
            client,
            server,
            plainte,
            delaiJour,
          );

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

            console.log(
              `✅ Alerte plainte non traitée | serveur ${server} | guild ${guildId}`,
            );
          } catch (err) {
            console.error(
              `❌ Erreur alerte plainte non traitée | serveur ${server} | guild ${guildId}`,
              err,
            );
            continue;
          }

          plainte.alerteEnvoyee[guildId] = true;
          rolePingDone[guildId] = true;
        }
      }

      for (const plainte of plaintesExistantes.filter(
        (p) =>
          !complaints.some((c) => c.lien === p.lien) &&
          (p.missingCount ?? 0) >= 12,
      )) {
        if (!Array.isArray(plainte.message)) continue;

        for (const { channelId, messageId } of plainte.message) {
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
              `🗑️ Message plainte supprimé | channel ${channelId} | message ${messageId}`,
            );
          } catch (err) {
            console.error(
              `❌ Erreur suppression message plainte (${messageId})`,
              err,
            );
          }
        }
      }

      saveData(
        `data/${server}/forum/plainte.json`,
        plaintesExistantes.filter((p) => p.missingCount < 13),
      );
    } catch (e) {
      console.log(`Erreur Plainte ${server} :`, e);
    }
  }
}

module.exports = { plainte };
