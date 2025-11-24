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

async function sendMessageWithEmbed(
  salon,
  container,
  roles = [],
  rolePingDone = false,
) {
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
      const config_forum = getData(`data/${server}/config-forum.json`);
      if (
        !config_forum?.Plainte?.Forum ||
        !config_forum?.Plainte?.active ||
        !config_forum?.Plainte?.Salon?.valeur
      )
        continue;
      await new Promise((res) => setTimeout(res, 5000));

      const data = await (await fetch(config_forum.Plainte.Forum)).text();
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

      if (nouvellesPlaintes.length && config_forum.Plainte?.active) {
        const salon = client.channels.cache.get(
          config_forum.Plainte.Salon.valeur,
        );
        if (!salon) console.warn(`⚠️ Salon introuvable pour ${server}`);
        else {
          let rolePingDone = false;
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

            const sent = await sendMessageWithEmbed(
              salon,
              container,
              config_forum.Plainte.Role?.valeur,
              rolePingDone,
            );
            rolePingDone = true;
            plainte.message.push({
              guildId: salon.guild.id,
              channelId: salon.id,
              messageId: sent.id,
            });

            if (salon.type === "GUILD_NEWS")
              await sent.crosspost().catch(() => {});
          }
        }
        plaintesExistantes.push(...nouvellesPlaintes);
        saveData(`data/${server}/forum/plainte.json`, plaintesExistantes);
      }
      const plaintesInitiales = [...plaintesExistantes];

      if (
        config_forum["Plainte non traitée"]?.active &&
        config_forum["Plainte non traitée"]?.Temps?.valeur
      ) {
        const salonNonTraitee = client.channels.cache.get(
          config_forum["Plainte non traitée"].Salon.valeur,
        );
        const délai = Math.floor(
          DateTime.now()
            .minus({ days: +config_forum["Plainte non traitée"].Temps.valeur })
            .toSeconds(),
        );
        let rolePingDone = false;

        for (const plainte of plaintesExistantes.filter(
          (p) => p.date < délai && !p.alerteEnvoyee,
        )) {
          const emoji = await getEmojiTete(client, plainte.auteur);
          const container = new ContainerBuilder()
            .setAccentColor(config.couleur[server])
            .addTextDisplayComponents((t) =>
              t.setContent(`## 🚨 Plainte non Traitée`),
            )
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((t) =>
              t.setContent(
                `📌 **Titre :** ${plainte.titre}\n${emoji} **Auteur :** ${plainte.auteur}\n\n*Postée depuis plus de ${config_forum["Plainte non traitée"].Temps.valeur} jours*`,
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

          await sendMessageWithEmbed(
            salonNonTraitee,
            container,
            config_forum["Plainte non traitée"].Role?.valeur,
            rolePingDone,
          );
          plainte.alerteEnvoyee = rolePingDone = true;
        }

        saveData(`data/${server}/forum/plainte.json`, plaintesExistantes);
      }

      for (const plainte of plaintesInitiales.filter(
        (p) => !complaints.some((c) => c.lien === p.lien),
      )) {
        for (const msg of plainte.message || []) {
          const channel = client.channels.cache.get(msg.channelId);
          if (channel)
            channel.messages
              .fetch(msg.messageId)
              .then((m) => m?.deletable && m.delete().catch(() => {}))
              .catch(() => {});
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
