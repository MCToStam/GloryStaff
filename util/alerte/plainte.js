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

async function plainte(client) {
  for (const server of config.liste_serveur) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    try {
      const config_forum = getData(`data/${server}/config-forum.json`);

      if (!config_forum.Plainte.Forum) continue;

      const { data } = await axios.get(config_forum.Plainte.Forum);
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

      const plaintesExistantes = getData(`data/${server}/forum/plainte.json`);

      const nouvellesPlaintes = complaints.filter(
        (c) => !plaintesExistantes.some((p) => p.lien === c.lien),
      );

      if (nouvellesPlaintes.length > 0) {
        if (
          config_forum.Plainte?.active &&
          config_forum.Plainte?.Salon &&
          config_forum.Plainte?.Forum
        ) {
          const salon = client.channels.cache.get(config_forum.Plainte.Salon);
          if (!salon) {
            console.warn(
              `⚠️ Salon introuvable pour ${server} (ID: ${config_forum.Plainte.Salon})`,
            );
          } else {
            let rolePingDone = false;
            for (const plainte of nouvellesPlaintes) {
              const embed = new EmbedBuilder()
                .setColor(config.couleur[server.toLowerCase()])
                .setTitle("Nouvelle Plainte")
                .setDescription(
                  `📌 **Titre :** ${plainte.titre}\n✏️ **Auteur :** ${plainte.auteur}\n\n*Cette plainte a été postée <t:${plainte.date}:R>.*`,
                )
                .setFooter({ text: config.footer });

              const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setURL(plainte.lien)
                  .setLabel("Aller sur la plainte")
                  .setStyle(ButtonStyle.Link),
              );

              try {
                let sentMessage;
                const plainteRoles = config_forum.Plainte?.Role;

                if (
                  Array.isArray(plainteRoles) &&
                  plainteRoles.length > 0 &&
                  !rolePingDone
                ) {
                  const roleMentions = plainteRoles
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

                plainte.message.push({
                  guildId: salon.guild.id,
                  channelId: salon.id,
                  messageId: sentMessage.id,
                });
                console.log(
                  `✅ Message envoyé pour une nouvelle plainte dans ${server}`,
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
          `🆕 ${nouvellesPlaintes.length} nouvelle(s) plainte(s) ajoutée(s).`,
        );
        plaintesExistantes.push(...nouvellesPlaintes);

        saveData(`data/${server}/forum/plainte.json`, plaintesExistantes);
      }

      if (
        config_forum["Plainte non traitée"]?.active &&
        config_forum["Plainte non traitée"]?.Salon &&
        config_forum["Plainte non traitée"]?.Temps
      ) {
        const salonNonTraitee = client.channels.cache.get(
          config_forum["Plainte non traitée"].Salon,
        );
        if (!salonNonTraitee) {
          console.warn(
            `⚠️ Salon introuvable pour les plaintes non traitées (${server})`,
          );
        } else {
          const delaiTimestamp = DateTime.now()
            .minus({
              days: parseInt(config_forum["Plainte non traitée"].Temps),
            })
            .toSeconds();

          const plaintesAnciennes = plaintesExistantes.filter(
            (plainte) =>
              plainte.date < delaiTimestamp && !plainte.alerteEnvoyee,
          );

          let rolePingDone = false;
          for (const plainte of plaintesAnciennes) {
            const embedAlerte = new EmbedBuilder()
              .setColor(config.couleur[server.toLowerCase()])
              .setTitle("⏳ Plainte non Traitée")
              .setDescription(
                `📌 **Titre :** ${plainte.titre}\n✏️ **Auteur :** ${plainte.auteur}\n\n*Cette plainte est en attente depuis plus de ${config_forum["Plainte non traitée"].Temps} jours !*`,
              )
              .setFooter({ text: config.footer });

            const actionRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setURL(plainte.lien)
                .setLabel("Voir la plainte")
                .setStyle(ButtonStyle.Link),
            );

            try {
              let sentMessage;
              if (
                Array.isArray(config_forum["Plainte non traitée"]?.Role) &&
                config_forum["Plainte non traitée"].Role.length > 0 &&
                !rolePingDone
              ) {
                const roleMentions = config_forum[
                  "Plainte non traitée"
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

              plainte.alerteEnvoyee = true;
              console.log(
                `🚨 Alerte envoyée pour une plainte non traitée dans ${server}`,
              );
            } catch (error) {
              console.error(
                `❌ Erreur lors de l'envoi de l'alerte pour ${server}:`,
                error.message,
              );
            }
          }

          saveData(`data/${server}/forum/plainte.json`, plaintesExistantes);
        }
      }

      const liensActuels = complaints.map((c) => c.lien);
      const plaintesMisesAJour = plaintesExistantes.filter((p) =>
        complaints.some((c) => c.lien === p.lien),
      );

      const plaintesSupprimees = plaintesExistantes.filter(
        (p) => !complaints.some((c) => c.lien === p.lien),
      );

      for (const plainte of plaintesSupprimees) {
        if (plainte.message && plainte.message.length > 0) {
          for (const msgInfo of plainte.message) {
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
                      `🗑️ Message supprimé pour une plainte résolue (${plainte.titre})`,
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
        JSON.stringify(plaintesExistantes) !==
        JSON.stringify(plaintesMisesAJour)
      ) {
        saveData(`data/${server}/forum/plainte.json`, plaintesMisesAJour);
      }
    } catch (error) {}
  }
}

module.exports = { plainte };
