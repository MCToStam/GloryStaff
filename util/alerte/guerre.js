const config = require("../../config");
const { getData, saveData } = require("../../util/module/getAndSaveData");
const axios = require("axios");
const cheerio = require("cheerio");
const { DateTime } = require("luxon");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

function convertirEnTimestamp(dateStr) {
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

  if (dateStr.includes("Il y a")) {
    const maintenant = DateTime.now().setZone("Europe/Paris");
    const regex = /Il y a (\d+) (minute|heure|jour)s?/;
    const match = dateStr.match(regex);

    if (match) {
      let [_, valeur, unité] = match;
      valeur = parseInt(valeur);

      if (unité === "minute")
        return Math.floor(maintenant.minus({ minutes: valeur }).toSeconds());
      if (unité === "heure")
        return Math.floor(maintenant.minus({ hours: valeur }).toSeconds());
      if (unité === "jour")
        return Math.floor(maintenant.minus({ days: valeur }).toSeconds());
    }
  }

  const regex = /(\d{1,2}) ([\p{L}éûàç]+) (\d{4}) à (\d{1,2}):(\d{2})/u;

  const cleaned = dateStr
    .replace(/.*le\s+/, "")
    .trim()
    .replace(/\u00A0/g, " ")
    .replace(/\u202F/g, " ");

  const match = cleaned.match(regex);

  if (!match) return null;

  let [_, jour, moisTexte, annee, heure, minute] = match;
  const mois = moisMapping[moisTexte.toLowerCase()];

  if (!mois) return null;

  const dateLocale = DateTime.fromObject(
    {
      year: parseInt(annee),
      month: parseInt(mois),
      day: parseInt(jour),
      hour: parseInt(heure),
      minute: parseInt(minute),
    },
    { zone: "Europe/Paris" },
  );

  return Math.floor(dateLocale.toSeconds());
}

async function guerre(client) {
  for (const server of config.liste_serveur) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    try {
      const config_forum = getData(`data/${server}/config-forum.json`);

      if (!config_forum.Guerre.Forum) continue;

      const { data } = await axios.get(config_forum.Guerre.Forum);
      const $ = cheerio.load(data);
      const complaints = [];

      $("tr").each((index, element) => {
        const badge = $(element)
          .find(".badge")
          .filter((_, el) => $(el).text().trim().includes("En Attente"));

        if (badge.length > 0) {
          const titleElement = $(element).find("th a.stretched-link").first();
          const title = titleElement.text().trim();
          const link = titleElement.attr("href");
          const author = $(element)
            .find("a.text-muted.stretched-link.position-relative")
            .first()
            .text()
            .trim();

          const dateElement = $(element)
            .find("span.small.text-muted")
            .filter((_, el) => $(el).text().includes("Posté par"))
            .parent()
            .find("span.small.text-muted")
            .last();

          const dateStr = dateElement.text().trim();
          const timestamp = convertirEnTimestamp(dateStr);

          if (title && link && timestamp) {
            complaints.push({
              titre: title,
              lien: `https://nationsglory.fr${link}`,
              auteur: author,
              date: timestamp,
              message: [],
              moderateur: null,
            });
          }
        }
      });

      const guerresExistantes = getData(`data/${server}/forum/guerre.json`);

      const nouvellesGuerres = complaints.filter(
        (c) => !guerresExistantes.some((p) => p.lien === c.lien),
      );

      if (nouvellesGuerres.length > 0) {
        if (
          config_forum.Guerre?.active &&
          config_forum.Guerre?.Salon &&
          config_forum.Guerre?.Forum
        ) {
          const salon = client.channels.cache.get(config_forum.Guerre.Salon);
          if (!salon) {
            console.warn(
              `⚠️ Salon introuvable pour ${server} (ID: ${config_forum.Guerre.Salon})`,
            );
          } else {
            let rolePingDone = false;
            for (const guerre of nouvellesGuerres) {
              const embed = new EmbedBuilder()
                .setColor(config.couleur[server.toLowerCase()])
                .setTitle("Nouvelle Guerre")
                .setDescription(
                  `📌 **Titre :** ${guerre.titre}\n✏️ **Auteur :** ${guerre.auteur}\n\n*Cette guerre a été postée <t:${guerre.date}:R>.*`,
                )
                .setFooter({ text: config.footer });

              const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setURL(guerre.lien)
                  .setLabel("Aller sur la guerre")
                  .setStyle(ButtonStyle.Link),
              );

              try {
                let sentMessage;
                const guerreRoles = config_forum.Guerre?.Role;

                if (
                  Array.isArray(guerreRoles) &&
                  guerreRoles.length > 0 &&
                  !rolePingDone
                ) {
                  const roleMentions = guerreRoles
                    .map((roleId) => `<@&${roleId}>`)
                    .join(", ");
                  sentMessage = await salon.send({
                    embeds: [embed],
                    components: [actionRow],
                    content: roleMentions,
                  });
                  rolePingDone = true;
                } else {
                  sentMessage = await salon.send({
                    embeds: [embed],
                    components: [actionRow],
                  });
                }

                guerre.message.push({
                  guildId: salon.guild.id,
                  channelId: salon.id,
                  messageId: sentMessage.id,
                });
                console.log(
                  `✅ Message envoyé pour une nouvelle guerre dans ${server}`,
                );
                if (salon.type === "GUILD_NEWS") {
                  try {
                    await sentMessage.crosspost();
                    console.log(
                      `📣 Message publié dans le salon d’annonce pour ${server}`,
                    );
                  } catch (err) {
                    console.warn(
                      `⚠️ Impossible de publier le message dans le salon d’annonce : ${err.message}`,
                    );
                  }
                }
              } catch (error) {
                console.error(
                  `❌ Erreur lors de l'envoi du message pour ${server}:`,
                  error.message,
                );
              }
            }
          }
        }

        console.log(
          `🆕 ${nouvellesGuerres.length} nouvelle(s) guerre(s) ajoutée(s).`,
        );
        guerresExistantes.push(...nouvellesGuerres);

        saveData(`data/${server}/forum/guerre.json`, guerresExistantes);
      }

      if (
        config_forum["Guerre non traitée"]?.active &&
        config_forum["Guerre non traitée"]?.Salon &&
        config_forum["Guerre non traitée"]?.Temps
      ) {
        const salonNonTraitee = client.channels.cache.get(
          config_forum["Guerre non traitée"].Salon,
        );
        if (!salonNonTraitee) {
          console.warn(
            `⚠️ Salon introuvable pour les guerres non traitées (${server})`,
          );
        } else {
          const delaiTimestamp = DateTime.now()
            .minus({
              days: parseInt(config_forum["Guerre non traitée"].Temps),
            })
            .toSeconds();

          const guerresAnciennes = guerresExistantes.filter(
            (guerre) => guerre.date < delaiTimestamp && !guerre.alerteEnvoyee,
          );

          let rolePingDone = false;
          for (const guerre of guerresAnciennes) {
            const embedAlerte = new EmbedBuilder()
              .setColor(config.couleur[server.toLowerCase()])
              .setTitle("⏳ Guerre non Traitée")
              .setDescription(
                `📌 **Titre :** ${guerre.titre}\n✏️ **Auteur :** ${guerre.auteur}\n\n*Cette guerre est en attente depuis plus de ${config_forum["Guerre non traitée"].Temps} jours !*`,
              )
              .setFooter({ text: config.footer });

            const actionRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setURL(guerre.lien)
                .setLabel("Voir la guerre")
                .setStyle(ButtonStyle.Link),
            );

            try {
              let sentMessage;
              if (
                Array.isArray(config_forum["Guerre non traitée"]?.Role) &&
                config_forum["Guerre non traitée"].Role.length > 0 &&
                !rolePingDone
              ) {
                const roleMentions = config_forum[
                  "Guerre non traitée"
                ].Role.map((roleId) => `<@&${roleId}>`).join(", ");

                sentMessage = await salonNonTraitee.send({
                  embeds: [embedAlerte],
                  components: [actionRow],
                  content: roleMentions,
                });

                rolePingDone = true;
              } else {
                sentMessage = await salonNonTraitee.send({
                  embeds: [embedAlerte],
                  components: [actionRow],
                });
              }

              guerre.alerteEnvoyee = true;
              console.log(
                `🚨 Alerte envoyée pour une guerre non traitée dans ${server}`,
              );
            } catch (error) {
              console.error(
                `❌ Erreur lors de l'envoi de l'alerte pour ${server}:`,
                error.message,
              );
            }
          }

          saveData(`data/${server}/forum/guerre.json`, guerresExistantes);
        }
      }

      const guerresMisesAJour = guerresExistantes.filter((p) =>
        complaints.some((c) => c.lien === p.lien),
      );

      const guerresSupprimees = guerresExistantes.filter(
        (p) => !complaints.some((c) => c.lien === p.lien),
      );

      for (const guerre of guerresSupprimees) {
        if (guerre.message && guerre.message.length > 0) {
          for (const msgInfo of guerre.message) {
            try {
              const guild = client.guilds.cache.get(msgInfo.guildId);
              if (guild) {
                const channel = guild.channels.cache.get(msgInfo.channelId);
                if (channel) {
                  const message = await channel.messages.fetch(
                    msgInfo.messageId,
                  );
                  if (message) {
                    if (message?.deletable) {
                      await message.delete();
                    }
                    console.log(
                      `🗑️ Message supprimé pour une guerre résolue (${guerre.titre})`,
                    );
                  }
                }
              }
            } catch (error) {
              console.warn(
                `⚠️ Impossible de supprimer un message d'alerte : ${error.message}`,
              );
            }
          }
        }
      }

      if (
        JSON.stringify(guerresExistantes) !== JSON.stringify(guerresMisesAJour)
      ) {
        saveData(`data/${server}/forum/guerre.json`, guerresMisesAJour);
      }
    } catch (error) {
      console.error(
        `❌ Erreur lors du traitement des guerres pour ${server}:`,
        error.message,
      );
    }
  }
}

module.exports = { guerre };
