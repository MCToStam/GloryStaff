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

async function sendMessage(salon, container, roles = [], rolePingDone = false) {
  const roleMentions = roles.map((roleId) => `<@&${roleId}>`).join(", ");

  const roleTextDisplay = new TextDisplayBuilder().setContent(roleMentions);
  let components = [container];
  if (!rolePingDone) components = [roleTextDisplay, container];
  return await salon.send({
    components,
    flags: MessageFlags.IsComponentsV2,
  });
}

async function plainte(client) {
  for (const server of config.liste_serveur) {
    try {
      const allConfig = getData(`data/${server}/config.json`);
      const configData = allConfig.find((c) => c.nom === "Forum");
      const plainteConfig = configData.systeme;
      await new Promise((res) => setTimeout(res, 5000));

      const data = await (await fetch(plainteConfig.Plainte.Forum)).text();
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

      const plaintesExistantes = getData(`data/${server}/forum/plainte.json`);
      const nouvellesPlaintes = complaints.filter(
        (c) => !plaintesExistantes.some((p) => p.lien === c.lien),
      );
      const plaintesAvantUpdate = [...plaintesExistantes];

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
            const emoji = await getEmojiTete(client, plainte.auteur);
            const container = new ContainerBuilder()
              .setAccentColor(config.couleur[server])
              .addTextDisplayComponents((t) =>
                t.setContent(`## 📍 Nouvelle Plainte`),
              )
              .addSeparatorComponents((s) => s)
              .addTextDisplayComponents((t) =>
                t.setContent(
                  `📌 **Titre :** ${plainte.titre}\n${emoji} **Auteur :** ${plainte.auteur}\n\n*Postée <t:${plainte.date}:R>*`,
                ),
              )
              .addSeparatorComponents((s) => s)
              .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setURL(plainte.lien)
                    .setLabel("🔗 Aller sur la Plainte")
                    .setStyle(ButtonStyle.Link),
                ),
              );

            const components = [container];

            if (roleMentions.length > 0 && !rolePingDone[guildId]) {
              components.push(
                new TextDisplayBuilder().setContent(roleMentions),
              );
            }

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
      saveData(`data/${server}/forum/plainte.json`, plaintesExistantes);
      const plaintesInitiales = [...plaintesExistantes];

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
          const emoji = await getEmojiTete(client, plainte.auteur);

          const container = new ContainerBuilder()
            .setAccentColor(config.couleur[server])
            .addTextDisplayComponents((t) =>
              t.setContent(`## 🚨 Plainte non traitée`),
            )
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((t) =>
              t.setContent(
                `📌 **Titre :** ${plainte.titre}\n` +
                  `${emoji} **Auteur :** ${plainte.auteur}\n\n` +
                  `*Postée depuis plus de ${delaiJour} jour${
                    delaiJour > 1 ? "s" : ""
                  }*`,
              ),
            )
            .addSeparatorComponents((s) => s)
            .addActionRowComponents(
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setURL(plainte.lien)
                  .setLabel("🔗 Aller sur la plainte")
                  .setStyle(ButtonStyle.Link),
              ),
            );

          const components = [container];

          if (roleMentions && !rolePingDone[guildId]) {
            components.push(new TextDisplayBuilder().setContent(roleMentions));
          }

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

          plainte.alerteEnvoyee ??= {};
          plainte.alerteEnvoyee[guildId] = true;
          rolePingDone[guildId] = true;
        }
      }

      saveData(`data/${server}/forum/plainte.json`, plaintesExistantes);

      for (const plainte of plaintesAvantUpdate.filter(
        (p) => !complaints.some((c) => c.lien === p.lien),
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
        plaintesInitiales.filter((p) =>
          complaints.some((c) => c.lien === p.lien),
        ),
      );
    } catch (e) {}
  }
}

module.exports = { plainte };
