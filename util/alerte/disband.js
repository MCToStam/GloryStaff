const config = require("../../config");
const { getData, saveData } = require("../../util/module/getAndSaveData");
const { getEmojiDrapeau, getEmojiTete } = require("../../util/module/emoji");
const { DateTime } = require("luxon");
const cheerio = require("cheerio");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

async function fetchAndParseCountriesHTML(serveur) {
  try {
    const response = await fetch(
      `https://nationsglory.fr/_servers/server_loader?server=${serveur}&uri=countries`,
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    );
    const html = await response.text();
    const $ = cheerio.load(html);

    const countries = [];
    $("#tablepays tbody tr").each((i, row) => {
      const $row = $(row);
      const name = $row.find("td a span").text().trim();
      const leader = $row.find("td").eq(1).text().trim();
      const date_fondation = $row.find("td").eq(3).text().trim();

      countries.push({ nom: name, chef: leader, date: date_fondation });
    });
    return countries;
  } catch (err) {
    console.error(`❌ Erreur lors du parsing HTML pour ${serveur} :`, err);
    return [];
  }
}

async function disband_14h00(client) {
  for (const serveur of config.liste_serveur) {
    const configuration = getData(`data/${serveur}/config-disband.json`);
    const messageConfig = configuration["Pays Pillable ( 14h )"];

    if (messageConfig?.active && messageConfig?.Salon.valeur) {
      const channelId = messageConfig.Salon.valeur;
      const channel = await client.channels.fetch(channelId);

      if (channel) {
        try {
          if (messageConfig.Prévisualisation.valeur !== "Oui") {
            const embed = new EmbedBuilder()
              .setTitle("💥 C'est l'heure des disbands !")
              .setDescription(
                "L'intégralité des pays soumis aux disbands est désormais disponible au pillage. C'est-à-dire que vous pouvez vous rendre dans ces pays et récupérer l'intégralité des ressources disponibles dans les coffres et ainsi casser des blocs. Il faut savoir que les pays sont pillables à partir de 14h, ils sont régénérés et supprimés à 18h.\n\nVoici les 4 différentes raisons de disband :\n- Inactivité du chef et du/des officier(s) de plus de 14 jours\n- Pays ayant moins de 6 membres\n- Pays sans fhome durant une semaine consécutive\n- Inactivité au serveur du pays durant plus d'un mois, après la mise en garde du staff\n\nSi tu ne peux pas te connecter pendant un long moment et tu as peur de te faire disband, alors effectue la commande ```/f absence add <vacation/other> <JJ/MM/YYYY de début> <JJ/MM/YYYY de fin>```",
              )
              .setColor(config.couleur[serveur])
              .setFooter({ text: config.footer });

            const actionRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel("Wiki Disband")
                .setURL(
                  "https://wiki.nationsglory.fr/fr/article/les-disbands-java-fqxmmr/",
                )
                .setStyle(ButtonStyle.Link)
                .setEmoji("1319374787570831421"),
              new ButtonBuilder()
                .setLabel("Wiki Absence")
                .setURL(
                  "https://wiki.nationsglory.fr/fr/article/gerer-son-pays-java-1lm9j56/#1-les-absences",
                )
                .setStyle(ButtonStyle.Link)
                .setEmoji("1319374787570831421"),
            );

            const options = {
              embeds: [embed],
              components: [actionRow],
            };

            if (
              messageConfig.Role.valeur &&
              Array.isArray(messageConfig.Role.valeur) &&
              messageConfig.Role.valeur.length > 0
            ) {
              options.content = messageConfig.Role.valeur
                .map((roleId) => `<@&${roleId}>`)
                .join(", ");
            }
            const sentMessage = await channel.send(options);
            if (channel.type === "GUILD_NEWS") {
              try {
                await sentMessage.crosspost();
                console.log(
                  `📣 Message publié dans le salon d’annonce pour ${serveur}`,
                );
              } catch (err) {
                console.warn(
                  `⚠️ Impossible de publier le message dans le salon d’annonce : ${err.message}`,
                );
              }
            }
          } else {
            let disbandData;
            try {
              const response = await fetch(
                `${config.glorybot_url}/api/disband?serveur=${serveur}`,
                {
                  headers: {
                    Authorization: `Bearer ${config.glorybot_token}`,
                    "Content-Type": "application/json",
                  },
                },
              );
              disbandData = await response.json();
            } catch (err) {
              console.error(
                "Erreur lors de la récupération des pays disband :",
                err,
              );
              return;
            }

            const uniqueCountries = new Set();
            const memberCountries = [];
            const inactiveCountries = [];
            const fhomeCountries = [];

            for (const country of disbandData) {
              if (!country.name) continue;

              if (
                country.reason === "member" &&
                !uniqueCountries.has(country.name)
              ) {
                memberCountries.push(country);
                uniqueCountries.add(country.name);
              } else if (
                country.reason === "inactivity" &&
                !uniqueCountries.has(country.name)
              ) {
                inactiveCountries.push(country);
                uniqueCountries.add(country.name);
              } else if (
                country.reason === "fhome" &&
                !uniqueCountries.has(country.name)
              ) {
                fhomeCountries.push(country);
                uniqueCountries.add(country.name);
              }
            }

            async function formatCountriesWithFlags(list) {
              const result = [];
              for (const country of list) {
                try {
                  const emoji = await getEmojiDrapeau(
                    client,
                    serveur,
                    country.name.toLowerCase(),
                  );
                  if (emoji) {
                    result.push(`<:${emoji.name}:${emoji.id}> ${country.name}`);
                  } else {
                    result.push(`${country.name}`);
                  }
                } catch (err) {
                  console.error(`Erreur pour le pays ${country.name}:`, err);
                  result.push(`${country.name}`);
                }
              }
              return result.join("\n");
            }

            let description = "";

            if (memberCountries.length > 0) {
              const formatted = await formatCountriesWithFlags(memberCountries);
              description += `**Moins de 6 membres :**\n${formatted}`;
            }
            if (inactiveCountries.length > 0) {
              const formatted =
                await formatCountriesWithFlags(inactiveCountries);
              description += `\n\n**Inactivité :**\n${formatted}`;
            }
            if (fhomeCountries.length > 0) {
              const formatted = await formatCountriesWithFlags(fhomeCountries);
              description += `\n\n**F Home :**\n${formatted}`;
            }

            description +=
              "\n\nCes pays sont désormais disponible au pillage. C'est-à-dire que vous pouvez vous rendre dans ces pays et récupérer l'intégralité des ressources disponibles dans les coffres et ainsi casser des blocs. Il faut savoir que les pays sont pillables à partir de 14h, ils sont régénérés et supprimés à 18h.\n\nVoici les 4 différentes raisons de disband :\n- Inactivité du chef et du/des officier(s) de plus de 14 jours\n- Pays ayant moins de 6 membres\n- Pays sans fhome durant une semaine consécutive\n- Inactivité au serveur du pays durant plus d'un mois, après la mise en garde du staff\n\nSi tu ne peux pas te connecter pendant un long moment et tu as peur de te faire disband, alors effectue la commande ```/f absence add <vacation/other> <JJ/MM/YYYY de début> <JJ/MM/YYYY de fin>```\n\n*À savoir que cette liste est une approximation, elle ne prend pas en compte les absences et peut avoir des erreurs.*";

            if (
              inactiveCountries.length === 0 &&
              memberCountries.length === 0 &&
              fhomeCountries.length === 0
            ) {
              description =
                "L'intégralité des pays soumis aux disbands est désormais disponible au pillage. C'est-à-dire que vous pouvez vous rendre dans ces pays et récupérer l'intégralité des ressources disponibles dans les coffres et ainsi casser des blocs. Il faut savoir que les pays sont pillables à partir de 14h, ils sont régénérés et supprimés à 18h.\n\nVoici les 4 différentes raisons de disband :\n- Inactivité du chef et du/des officier(s) de plus de 14 jours\n- Pays ayant moins de 6 membres\n- Pays sans fhome durant une semaine consécutive\n- Inactivité au serveur du pays durant plus d'un mois, après la mise en garde du staff\n\nSi tu ne peux pas te connecter pendant un long moment et tu as peur de te faire disband, alors effectue la commande ```/f absence add <vacation/other> <JJ/MM/YYYY de début> <JJ/MM/YYYY de fin>```";
            }

            const embed = new EmbedBuilder()
              .setTitle("💥 C'est l'heure des disbands !")
              .setDescription(description)
              .setColor(config.couleur[serveur])
              .setFooter({ text: config.footer });

            const actionRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel("Wiki Disband")
                .setURL(
                  "https://wiki.nationsglory.fr/fr/article/les-disbands-java-fqxmmr/",
                )
                .setStyle(ButtonStyle.Link)
                .setEmoji("1319374787570831421"),
              new ButtonBuilder()
                .setLabel("Wiki Absence")
                .setURL(
                  "https://wiki.nationsglory.fr/fr/article/gerer-son-pays-java-1lm9j56/#1-les-absences",
                )
                .setStyle(ButtonStyle.Link)
                .setEmoji("1319374787570831421"),
            );

            const options = {
              embeds: [embed],
              components: [actionRow],
            };

            if (
              messageConfig.Role.valeur &&
              Array.isArray(messageConfig.Role.valeur) &&
              messageConfig.Role.valeur.length > 0
            ) {
              options.content = messageConfig.Role.valeur
                .map((roleId) => `<@&${roleId}>`)
                .join(", ");
            }
            const sentMessage = await channel.send(options);
            if (channel.type === "GUILD_NEWS") {
              try {
                await sentMessage.crosspost();
                console.log(
                  `📣 Message publié dans le salon d’annonce pour ${serveur}`,
                );
              } catch (err) {
                console.warn(
                  `⚠️ Impossible de publier le message dans le salon d’annonce : ${err.message}`,
                );
              }
            }
          }
        } catch (err) {
          console.error("❌ Erreur lors de l'action des disbands :", err);
        }
      }
    }
  }
}

async function disband_17h59(client) {
  const countrySnapshot = {};
  for (const serveur of config.liste_serveur) {
    try {
      const responseJson = await fetch(
        `https://apiv2.nationsglory.fr/mods/country_list/${serveur}`,
      );
      const jsonCountries = await responseJson.json();

      const htmlCountries = await fetchAndParseCountriesHTML(serveur);

      countrySnapshot[serveur] = { jsonCountries, htmlCountries };
    } catch (err) {
      console.error(
        `❌ Impossible de récupérer les pays pour ${serveur} :`,
        err,
      );
    }
  }

  saveData("data/country_list.json", countrySnapshot);
  console.log("✅ Sauvegarde des pays (JSON + HTML) à 17h58 terminée.");
}

async function disband_18h15(client) {
  let savedCountries = getData("data/country_list.json");
  if (!savedCountries) savedCountries = {};

  for (const serveur of config.liste_serveur) {
    const configuration = getData(`data/${serveur}/config-disband.json`);
    const messageConfig = configuration["Pays Disband ( 18h15 )"];

    if (messageConfig?.active && messageConfig?.Salon.valeur) {
      const channelId = messageConfig.Salon.valeur;
      const channel = await client.channels.fetch(channelId);

      if (channel) {
        try {
          const responseJson = await fetch(
            `https://apiv2.nationsglory.fr/mods/country_list/${serveur}`,
          );
          const newJsonCountries = await responseJson.json();

          const newHtmlCountries = await fetchAndParseCountriesHTML(serveur);
          saveData(`data/new_country_list_${serveur}.json`, newHtmlCountries);

          const oldJsonCountries = savedCountries[serveur]?.jsonCountries || [];
          const oldJsonNames = new Set(oldJsonCountries.map((c) => c.name));

          const addedJsonCountries = newJsonCountries.filter(
            (c) => !oldJsonNames.has(c.name),
          );

          const oldHtmlCountries = savedCountries[serveur]?.htmlCountries || [];

          const oldNameDatePairs = new Set(
            oldHtmlCountries.map((c) => `${c.nom}|${c.date}`),
          );

          const addedHtmlCountries = newHtmlCountries.filter(
            (c) => !oldNameDatePairs.has(`${c.nom}|${c.date}`),
          );

          const today = DateTime.local().setLocale("fr").startOf("day");
          const todayHtmlCountries = addedHtmlCountries.filter((c) => {
            const parsedDate = DateTime.fromFormat(c.date, "dd LLLL yyyy", {
              locale: "fr",
            }).startOf("day");
            return parsedDate.equals(today);
          });

          let description =
            "L'intégralité des pays qui étaient disponibles au pillage à 14h ont été supprimés.";

          const formattedJsonCountries = [];

          for (const c of addedJsonCountries.sort((a, b) =>
            a.name.localeCompare(b.name),
          )) {
            try {
              const flagEmoji = await getEmojiDrapeau(
                client,
                serveur,
                c.name.toLowerCase(),
              );

              const flag = flagEmoji
                ? `<:${flagEmoji.name}:${flagEmoji.id}> `
                : "";
              formattedJsonCountries.push(`${flag}${c.name}`);
            } catch (err) {
              console.error(
                `Erreur lors de la récupération de l'emoji pour ${c.name}:`,
                err,
              );
              formattedJsonCountries.push(`${c.name}`);
            }
          }

          if (formattedJsonCountries.length > 0) {
            description += `\n\n${formattedJsonCountries.join("\n")}`;
          }

          const formattedHtmlCountries = [];

          for (const c of todayHtmlCountries.sort((a, b) =>
            a.nom.localeCompare(b.nom),
          )) {
            try {
              const flagEmoji = await getEmojiDrapeau(
                client,
                serveur,
                c.nom.toLowerCase(),
              );

              let headEmoji = null;
              if (c.chef) {
                try {
                  headEmoji = await getEmojiTete(client, c.chef);
                } catch (err) {
                  console.error(
                    `Erreur lors de la récupération de l'emoji tête pour ${c.chef}:`,
                    err,
                  );
                }
              }

              const flag = flagEmoji
                ? `<:${flagEmoji.name}:${flagEmoji.id}> `
                : "";
              const head = headEmoji
                ? `<:${headEmoji.name}:${headEmoji.id}> `
                : "";
              const leaderInfo = c.chef ? `\n↪ Créé par ${head}${c.chef}` : "";

              formattedHtmlCountries.push(`${flag}${c.nom}${leaderInfo}`);
            } catch (err) {
              console.error(`Erreur pour le pays ${c.nom}:`, err);
              formattedHtmlCountries.push(c.nom);
            }
          }

          if (formattedHtmlCountries.length > 0) {
            description += `\n${formattedHtmlCountries.join("\n")}`;
          }

          const embed = new EmbedBuilder()
            .setTitle("💥 Les pays sont supprimés !")
            .setDescription(description)
            .setColor(config.couleur[serveur])
            .setFooter({ text: config.footer });

          const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel("Wiki Disband")
              .setURL(
                "https://wiki.nationsglory.fr/fr/article/les-disbands-java-fqxmmr/",
              )
              .setStyle(ButtonStyle.Link)
              .setEmoji("1319374787570831421"),
            new ButtonBuilder()
              .setLabel("Wiki Absence")
              .setURL(
                "https://wiki.nationsglory.fr/fr/article/gerer-son-pays-java-1lm9j56/#1-les-absences",
              )
              .setStyle(ButtonStyle.Link)
              .setEmoji("1319374787570831421"),
          );

          const options = {
            embeds: [embed],
            components: [actionRow],
          };
          if (
            messageConfig.Role.valeur &&
            Array.isArray(messageConfig.Role.valeur) &&
            messageConfig.Role.valeur.length > 0
          ) {
            options.content = messageConfig.Role.valeur
              .map((roleId) => `<@&${roleId}>`)
              .join(", ");
          }
          const sentMessage = await channel.send(options);
          if (channel.type === "GUILD_NEWS") {
            try {
              await sentMessage.crosspost();
              console.log(
                `📣 Message publié dans le salon d’annonce pour ${serveur}`,
              );
            } catch (err) {
              console.warn(
                `⚠️ Impossible de publier le message dans le salon d’annonce : ${err.message}`,
              );
            }
          }
        } catch (err) {
          console.error("❌ Erreur lors de l'action des disbands :", err);
        }
      }
    }
  }
}

module.exports = { disband_14h00, disband_17h59, disband_18h15 };
