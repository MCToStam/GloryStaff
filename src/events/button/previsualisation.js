const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const AbortController = require("abort-controller");
const { DateTime } = require("luxon");
const cheerio = require("cheerio");
const {
  getAbsolutePath,
  getData,
} = require("../../../util/module/getAndSaveData");

async function getCountryEmoji(guild, serveur, pays, config) {
  try {
    const response = await fetch(
      `${
        config.glorybot_url
      }/api/drapeau?serveur=${serveur}&pays=${pays.toLowerCase()}`,
    );

    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.startsWith("image/")) {
      const errorText = await response.text();
      return null;
    }

    const emoji = await guild.emojis.create(
      `${
        config.glorybot_url
      }/api/drapeau?serveur=${serveur}&pays=${pays.toLowerCase()}`,
      `${serveur}_${pays}`,
    );

    return emoji;
  } catch (err) {
    console.error(
      `❌ Impossible de récupérer ou créer l'émoji pour le pays ${pays.toLowerCase()} :`,
      err,
    );
    return null;
  }
}

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

module.exports = {
  data: {
    name: "previsualisation",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const systeme = interaction.customId.split("-")[1];
    const embedColor = interaction.message.embeds[0]?.color;

    const serveur = Object.keys(config.couleur).find(
      (key) => config.couleur[key] === embedColor,
    );

    try {
      if (systeme === "Alerte") {
        const configData = getData(`data/${serveur}/config-onu.json`);
        const imagePath = getAbsolutePath(`/data/${serveur}/onu.png`);
        const attachment = new AttachmentBuilder(imagePath, {
          name: "onu.png",
        });
        const [jourOnu, heureOnu] = configData.Alerte["Heure"].split(" ");

        const embed = {
          color: config.couleur[serveur],
          title: `🌐 ONU ${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          } 🌐`,
          description: `L’ONU est une réunion hebdomadaire entre le staff et les joueurs ! Ce rendez-vous permet de faire des rappels, annoncer les nouveautés, les rank ainsi que de faire des pubs, des demandes de missiles, d’autonuke et de poser toutes les questions qui vous titillent. Afin de participer à l'ONU, il vous suffit de rejoindre le [Discord Global](https://discord.gg/nationsglory) de NationsGlory et rejoindre le salon ${
            configData.Alerte["Salon NationsGlory"]
          }.\n\nVoici les différentes règlementations :\n- Les assauts sont interdit\n- Le PvP est désactivé sauf dans les arènes et les warzones\n- Les warzones ne distribuent pas de récompenses\n- La présence des chefs est fortement recommandée\n\nCette réunion a lieu le **${jourOnu.toLowerCase()}** à **${heureOnu}**.`,
          image: { url: `attachment://onu.png` },
          footer: { text: config.footer },
        };

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("onu-help")
            .setLabel("Je n'arrive pas à accéder au salon")
            .setStyle(ButtonStyle.Primary),
        );

        return interaction.reply({
          embeds: [embed],
          files: [attachment],
          components: [actionRow],
          ephemeral: true,
        });
      } else if (systeme === "Rappel 1") {
        const configData = getData(`data/${serveur}/config-onu.json`);
        const imagePath = getAbsolutePath(`/data/${serveur}/rappelonu.png`);
        const attachment = new AttachmentBuilder(imagePath, {
          name: "rappel.png",
        });
        const [jourOnu, heureOnu] = configData.Alerte["Heure"].split(" ");
        const rappelTime = parseInt(configData["Rappel 1"].Temps) || 30;

        const embed = {
          color: config.couleur[serveur],
          title: `📅 Rappel ONU ${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }`,
          description: `C'est bientôt l'ONU ! Pour rappel, cette réunion est prévue pour **${jourOnu}** à **${heureOnu}**, donc dans exactement **${rappelTime} ${
            rappelTime > 1 ? "minutes" : "minute"
          }**. Ne manquez pas l'occasion de participer à ce regroupement !`,
          image: { url: `attachment://rappel.png` },
          footer: { text: config.footer },
        };

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("onu-help")
            .setLabel("Qu'est ce que l'ONU ?")
            .setStyle(ButtonStyle.Primary),
        );

        return interaction.reply({
          embeds: [embed],
          files: [attachment],
          components: [actionRow],
          ephemeral: true,
        });
      } else if (systeme === "Rappel 2") {
        const configData = getData(`data/${serveur}/config-onu.json`);
        const imagePath = getAbsolutePath(`/data/${serveur}/onu.png`);
        const attachment = new AttachmentBuilder(imagePath, {
          name: "rappel.png",
        });
        const [jourOnu, heureOnu] = configData.Alerte["Heure"].split(" ");
        const rappelTime = parseInt(configData["Rappel 2"].Temps) || 60;

        const embed = {
          color: config.couleur[serveur],
          title: `📅 Rappel ONU ${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }`,
          description: `C'est bientôt l'ONU ! Pour rappel, cette réunion est prévue pour **${jourOnu}** à **${heureOnu}**, donc dans exactement **${rappelTime} ${
            rappelTime > 1 ? "minutes" : "minute"
          }**. Ne manquez pas l'occasion de participer à ce regroupement !`,
          image: { url: `attachment://rappel.png` },
          footer: { text: config.footer },
        };

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("onu-help")
            .setLabel("Qu'est ce que l'ONU ?")
            .setStyle(ButtonStyle.Primary),
        );

        return interaction.reply({
          embeds: [embed],
          files: [attachment],
          components: [actionRow],
          ephemeral: true,
        });
      } else if (systeme === "Rappel 3") {
        const configData = getData(`data/${serveur}/config-onu.json`);
        const imagePath = getAbsolutePath(`/data/${serveur}/onu.png`);
        const attachment = new AttachmentBuilder(imagePath, {
          name: "rappel.png",
        });
        const [jourOnu, heureOnu] = configData.Alerte["Heure"].split(" ");
        const rappelTime = parseInt(configData["Rappel 3"].Temps) || 120;

        const embed = {
          color: config.couleur[serveur],
          title: `📅 Rappel ONU ${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }`,
          description: `C'est bientôt l'ONU ! Pour rappel, cette réunion est prévue pour **${jourOnu}** à **${heureOnu}**, donc dans exactement **${rappelTime} ${
            rappelTime > 1 ? "minutes" : "minute"
          }**. Ne manquez pas l'occasion de participer à ce regroupement !`,
          image: { url: `attachment://rappel.png` },
          footer: { text: config.footer },
        };

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("onu-help")
            .setLabel("Qu'est ce que l'ONU ?")
            .setStyle(ButtonStyle.Primary),
        );

        return interaction.reply({
          embeds: [embed],
          files: [attachment],
          components: [actionRow],
          ephemeral: true,
        });
      } else if (systeme === "Sanction Staff") {
        const oldSanctions = Math.floor(Math.random() * 21) + 0;
        const newSanctions = oldSanctions + 1;
        const capitalizedServeur =
          serveur.charAt(0).toUpperCase() + serveur.slice(1);
        const emojiId = config.emoji[serveur.toLowerCase()];
        let texte_sanction = "";
        if (newSanctions > 1) {
          texte_sanction = "sanctions";
        } else {
          texte_sanction = "sanction";
        }
        const embed = new EmbedBuilder()
          .setTitle(`Nouvelle Sanction`)
          .setColor(config.couleur[serveur])
          .setDescription(
            `**ToStam** a maintenant **${newSanctions} ${texte_sanction}** sur le serveur <:NG${capitalizedServeur}:${emojiId}> **${capitalizedServeur}** ! Il en avait auparavant **${oldSanctions}**.`,
          )
          .setFooter({ text: config.footer });
        return interaction.reply({ embeds: [embed], ephemeral: true });
      } else if (systeme === "Affichage Staff") {
        const staffData = getData(`data/${serveur}/staff-serveur.json`);

        const escapeUnderscore = (text) => text.replace(/_/g, "\\_");

        const effectifRole = (role) => {
          const members = staffData[role].filter((name) => name.trim() !== "");
          return members.length;
        };

        const description = `
**${config.emojigrade["Administrateur"]} Administrateurs (${effectifRole(
          "Administrateur",
        )}) :**\n${
          escapeUnderscore(staffData["Administrateur"].join(", ")) || "Aucun"
        }
\n**${config.emojigrade["Super-Modérateur"]} Super Modérateurs (${effectifRole(
          "Super-Modérateur",
        )}) :**\n${
          escapeUnderscore(staffData["Super-Modérateur"].join(", ")) || "Aucun"
        }
\n**${config.emojigrade["Modérateur Plus"]} Modérateurs Plus (${effectifRole(
          "Modérateur Plus",
        )}) :**\n${
          escapeUnderscore(staffData["Modérateur Plus"].join(", ")) || "Aucun"
        }
\n**${config.emojigrade["Modérateur"]} Modérateurs (${effectifRole(
          "Modérateur",
        )}) :**\n${
          escapeUnderscore(staffData["Modérateur"].join(", ")) || "Aucun"
        }
\n**${config.emojigrade["Modérateur Test"]} Modérateurs Tests (${effectifRole(
          "Modérateur Test",
        )}) :**\n${
          escapeUnderscore(staffData["Modérateur Test"].join(", ")) || "Aucun"
        }
\n**${config.emojigrade["Guide"]} Guides (${effectifRole("Guide")}) :**\n${
          escapeUnderscore(staffData["Guide"].join(", ")) || "Aucun"
        }
\n\n*Dernière mise à jour : <t:${Math.floor(Date.now() / 1000)}:R>*
`;

        const embed = new EmbedBuilder()
          .setAuthor({
            name: `Staff du serveur ${
              serveur.charAt(0).toUpperCase() + serveur.slice(1)
            }`,
            url: `https://nationsglory.fr/server/${serveur}/staff`,
          })
          .setThumbnail(
            `${config.glorybot_url}/api/banniere?serveur=${serveur}`,
          )
          .setColor(config.couleur[serveur])
          .setDescription(description)
          .setFooter({ text: config.footer });
        return interaction.reply({ embeds: [embed], ephemeral: true });
      } else if (systeme === "Full Build") {
        const paysData = getData("data/pays.json");
        const paysa = paysData[Math.floor(Math.random() * 238) + 1];
        const paysb = paysData[Math.floor(Math.random() * 238) + 1];
        const embed = new EmbedBuilder()
          .setTitle(`🏚️ FullBuild`)
          .setColor(config.couleur[serveur])
          .setThumbnail(
            `${config.glorybot_url}/api/drapeau?serveur=${serveur}&pays=${paysa}`,
          )
          .setDescription(
            `<@${interaction.user.id}> vient de valider le fullbuild de pays **${paysa}**. Ce pays a donc maintenant la permission de s'étendre sur le pays **${paysb}**.`,
          )
          .setFooter({ text: config.footer });
        return interaction.reply({ embeds: [embed], ephemeral: true });
      } else if (systeme === "Conquête Territoriale") {
        const paysData = getData("data/pays.json");
        const paysa = paysData[Math.floor(Math.random() * 238) + 1];
        const paysb = paysData[Math.floor(Math.random() * 238) + 1];
        const embed = new EmbedBuilder()
          .setTitle(`✈️ Conquête Territoriale`)
          .setColor(config.couleur[serveur])
          .setThumbnail(
            `${config.glorybot_url}/api/drapeau?serveur=${serveur}&pays=${paysa}`,
          )
          .setDescription(
            `<@${interaction.user.id}> vient de valider la conquête territoriale du pays **${paysa}**. Ce pays a donc annexé le pays **${paysb}**.`,
          )
          .setFooter({ text: config.footer });
        return interaction.reply({ embeds: [embed], ephemeral: true });
      } else if (systeme === "Plainte") {
        const embed = new EmbedBuilder()
          .setTitle("Nouvelle Plainte")
          .setColor(config.couleur[serveur])
          .setDescription(
            "📌 **Titre :** Plainte N°1381 : LaBrindille sur Netrox11 | Deportation assaut\n✏️ **Auteur :** Matheux74_V2\n\n*Cette plainte a été postée <t:1741278720:R>.*",
          )
          .setFooter({ text: config.footer });

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setURL(
              "https://nationsglory.fr/forums/thread/plainte-n1381-labrindille-sur-netrox11-deportation-assaut.129657",
            )
            .setLabel("Aller sur la plainte")
            .setStyle(ButtonStyle.Link),
        );
        return interaction.reply({
          embeds: [embed],
          components: [actionRow],
          ephemeral: true,
        });
      } else if (systeme === "Guerre") {
        const embed = new EmbedBuilder()
          .setTitle("Nouvelle Guerre")
          .setColor(config.couleur[serveur])
          .setDescription(
            "📌 **Titre :** Honduras vs Libye\n✏️ **Auteur :** Raptor_129\n\n*Cette guerre a été postée <t:1741527120:R>.*",
          )
          .setFooter({ text: config.footer });

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setURL(
              "https://nationsglory.fr/forums/thread/honduras-vs-libye.129841",
            )
            .setLabel("Aller sur la guerre")
            .setStyle(ButtonStyle.Link),
        );
        return interaction.reply({
          embeds: [embed],
          components: [actionRow],
          ephemeral: true,
        });
      } else if (systeme === "Plainte non traitée") {
        const config_forum = getData(`data/${serveur}/config-forum.json`);

        const embed = new EmbedBuilder()
          .setTitle("⏳ Plainte non Traitée")
          .setColor(config.couleur[serveur])
          .setDescription(
            `📌 **Titre :** Plainte N°1381 : LaBrindille sur Netrox11 | Deportation assaut\n✏️ **Auteur :** Matheux74_V2\n\n*Cette plainte est en attente depuis plus de ${
              config_forum["Plainte non traitée"].Temps || "X"
            } jours !*`,
          )
          .setFooter({ text: config.footer });

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setURL(
              "https://nationsglory.fr/forums/thread/plainte-n1381-labrindille-sur-netrox11-deportation-assaut.129657",
            )
            .setLabel("Voir la plainte")
            .setStyle(ButtonStyle.Link),
        );
        return interaction.reply({
          embeds: [embed],
          components: [actionRow],
          ephemeral: true,
        });
      } else if (systeme === "Guerre non traitée") {
        const config_forum = getData(`data/${serveur}/config-forum.json`);

        const embed = new EmbedBuilder()
          .setTitle("⏳ Guerre non Traitée")
          .setColor(config.couleur[serveur])
          .setDescription(
            `📌 **Titre :** Honduras vs Libye\n✏️ **Auteur :** Raptor_129\n\n*Cette plainte est en attente depuis plus de ${
              config_forum["Guerre non traitée"].Temps || "X"
            } jours !*`,
          )
          .setFooter({ text: config.footer });

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setURL(
              "https://nationsglory.fr/forums/thread/honduras-vs-libye.129841",
            )
            .setLabel("Voir la guerre")
            .setStyle(ButtonStyle.Link),
        );
        return interaction.reply({
          embeds: [embed],
          components: [actionRow],
          ephemeral: true,
        });
      } else if (systeme === "Double Lead") {
        const embed = new EmbedBuilder()
          .setTitle("Double Lead")
          .setColor(config.couleur[serveur])
          .setDescription(
            "Le joueur **ToStam** possède différents pays sur plusieurs serveurs :\n<:NGBlue:1254508656859418754> **Blue** : France\n<:NGOrange:1254508503528378369> **Orange** : Allemagne\n",
          )
          .setFooter({ text: config.footer });

        return interaction.reply({ embeds: [embed], ephemeral: true });
      } else if (systeme === "répartition") {
        const repartitionData = getData(`data/${serveur}/config-notation.json`);
        const keys = Object.keys(repartitionData["répartition"]);
        const hasNumberKey = keys.some((key) => /^\d+$/.test(key));

        await interaction.deferReply({ ephemeral: true });

        let numberKeysValues;

        let linkData;
        try {
          const response = await fetch(`${config.glorybot_url}/api/get-ng`);
          const json = await response.json();

          if (!json.success || !json.data) {
            throw new Error("Réponse invalide de l'API get-ng");
          }

          linkData = json.data;
        } catch (err) {
          console.error(
            "Erreur lors de la récupération des données depuis l'API get-ng:",
            err,
          );
          return interaction.reply({
            content:
              "Impossible de récupérer les données de liaison des pseudos NG.",
            ephemeral: true,
          });
        }

        const createdEmojis = [];
        const guild = interaction.client.guilds.cache.get(
          "1349379748576366633",
        );
        if (hasNumberKey) {
          const emojiMap = {};
          for (const key of keys.filter((k) => /^\d+$/.test(k))) {
            const username = linkData[key] || false;
            if (username) {
              try {
                const emoji = await guild.emojis.create({
                  attachment: `https://skins.nationsglory.fr/face/${username}/3d/4`,
                  name: username.slice(0, 32),
                });
                createdEmojis.push(emoji);

                emojiMap[key] = emoji.toString();
              } catch (err) {
                console.log(
                  `Erreur lors de la création ou de la récupération de l'émoji pour ${username}:`,
                  err,
                );
                emojiMap[key] = "";
              }
            }
          }

          numberKeysValues = keys
            .filter((key) => /^\d+$/.test(key))
            .map((key) => {
              const username = linkData[key] || "Utilisateur inconnu";
              const emoji = emojiMap[key] || "";
              return `${emoji} <@${key}> : ${repartitionData["répartition"][key]}`;
            })
            .join("\n");
        } else {
          const staffData = getData(`data/${serveur}/staff.json`);

          const admins = staffData["Administrateur"] || [];
          const superMods = staffData["Super-Modérateur"] || [];
          const staffList = [...admins, ...superMods];
          staffList.sort(() => Math.random() - 0.5);

          let totalNumbers = 0;
          if (config.liste_serveur_bedrock.includes(serveur)) {
            totalNumbers = 219;
          } else {
            totalNumbers = 260;
          }
          const rangePerStaff = Math.floor(totalNumbers / staffList.length);
          const remainder = totalNumbers % staffList.length;

          let currentStart = 1;
          const distribution = {};

          staffList.forEach((displayName, index) => {
            const rangeEnd =
              currentStart + rangePerStaff - 1 + (index < remainder ? 1 : 0);
            distribution[displayName] = `${currentStart} à ${rangeEnd}`;
            currentStart = rangeEnd + 1;
          });

          const emojiMap = {};

          try {
            for (const displayName of staffList) {
              const username = linkData[displayName] || false;
              if (username) {
                const imageUrl = `https://skins.nationsglory.fr/face/${username}/3d/4`;
                try {
                  const emoji = await guild.emojis.create(imageUrl, username);
                  createdEmojis.push(emoji);

                  emojiMap[displayName] = emoji.toString();
                } catch (err) {
                  console.log(
                    `Erreur lors de la création ou de la récupération de l'émoji pour ${username}:`,
                    err,
                  );
                  emojiMap[displayName] = "";
                }
              }
            }
          } catch (err) {
            console.log(`Erreur lors de la gestion des émojis du staff :`, err);
          }

          numberKeysValues = Object.entries(distribution)
            .map(([displayName, range]) => {
              const emoji = emojiMap[displayName] || "";
              return `${emoji} <@${displayName}> : ${range}`;
            })
            .join("\n");
        }

        const imagePath = config.liste_serveur_bedrock.includes(serveur)
          ? getAbsolutePath("data/ordredesnotations_bedrock.png")
          : getAbsolutePath("data/ordredesnotations_java.png");

        const attachment = new AttachmentBuilder(imagePath, {
          name: "ordre-des-notations.png",
        });

        const date = new Date();
        const jour = String(date.getDate()).padStart(2, "0");
        const mois = String(date.getMonth() + 1).padStart(2, "0");

        const embed = new EmbedBuilder()
          .setColor(config.couleur[serveur])
          .setTitle(`Annonce des Notations - Semaine du ${jour}/${mois}`)
          .setDescription(
            `Voici la liste des staffs qui sont en charge des notations, si vous avez un recours à faire, il est préférable de s'adresser à la bonne qui vous a noté sur TeamSpeak ( ts.nationsglory.fr ) ou sur Discord.\n\n${numberKeysValues}`,
          )
          .setImage("attachment://ordre-des-notations.png")
          .setFooter({ text: config.footer });

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("notation_help")
            .setLabel("Informations Supplémentaires")
            .setStyle(ButtonStyle.Success),
        );

        await interaction.editReply({
          embeds: [embed],
          components: [actionRow],
          files: [attachment],
          ephemeral: true,
        });

        for (const emoji of createdEmojis) {
          try {
            await emoji.delete();
          } catch (err) {
            console.error(
              `❌ Impossible de supprimer l'émoji ${emoji.name} :`,
              err,
            );
          }
        }
      } else if (systeme === "classement") {
        await interaction.deferReply({ ephemeral: true });

        const weekRes = await fetch(`${config.glorybot_url}/api/notationWeek`);
        const weekJson = await weekRes.json();
        const week = weekJson.semaine;

        const response = await fetch(
          `https://publicapi.nationsglory.fr/notations?week=${week}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${config.apitoken}`,
              "Content-Type": "application/json",
            },
          },
        );
        const data = await response.json();

        const topCountries = data
          .slice(0, 3)
          .map(
            (entry, index) =>
              `<:NG${entry.server.charAt(0).toUpperCase()}${entry.server.slice(
                1,
              )}:${config.emoji[entry.server]}> ${entry.pays.replace(
                /([a-z])([A-Z])/g,
                "$1 $2",
              )}・${entry.bourse}$`,
          )
          .join("\n");

        const emojis = {};
        const createdEmojis = [];
        const guild = await client.guilds.fetch("1349379748576366633");

        const topServerCountriesRaw = data
          .filter((entry) => entry.server === serveur)
          .slice(0, 10);

        for (const entry of topServerCountriesRaw) {
          const pays = entry.pays.toLowerCase();
          const emojiName = `${serveur}_${pays}`;

          let emoji = guild.emojis.cache.find((e) => e.name === emojiName);
          if (!emoji) {
            try {
              emoji = await guild.emojis.create(
                `${config.glorybot_url}/api/drapeau?serveur=${serveur}&pays=${pays}`,
                emojiName,
              );
            } catch (err) {
              console.error(
                `Erreur lors de la création de l'emoji pour ${pays}:`,
                err,
              );
            }
          }

          if (emoji) {
            createdEmojis.push(emoji);
            emojis[pays] = `<:${emoji.name}:${emoji.id}>`;
          } else {
            emojis[pays] = "🏳️";
          }
        }

        const topServerCountries = topServerCountriesRaw
          .map((entry) => {
            const paysNom = entry.pays.replace(/([a-z])([A-Z])/g, "$1 $2");
            const emoji = emojis[entry.pays.toLowerCase()] || "🏳️";
            return `${emoji} ${paysNom}・${entry.bourse}$`;
          })
          .join("\n");

        const embed = new EmbedBuilder()
          .setAuthor({
            name: "🏆 Classement des Notations",
            url: `https://nationsglory.fr/notations/${serveur}/${week}`,
          })
          .setDescription(
            `**<:NationsGlory:1132392873787129856> Top 3 Inter-Serveur :**\n${topCountries}\n\n**<:NG${serveur
              .charAt(0)
              .toUpperCase()}${serveur.slice(1)}:${
              config.emoji[serveur]
            }> Top 10 ${serveur.charAt(0).toUpperCase()}${serveur.slice(
              1,
            )} :**\n${topServerCountries}`,
          )
          .setColor(config.couleur[serveur])
          .setFooter({ text: config.footer });

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("notation_help")
            .setLabel("Informations Supplémentaires")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`notation_op-${week}`)
            .setLabel("Qui note mon pays ?")
            .setStyle(ButtonStyle.Primary),
        );

        interaction.editReply({
          embeds: [embed],
          components: [actionRow],
          ephemeral: true,
        });
        for (const emoji of createdEmojis) {
          try {
            await emoji.delete();
          } catch (err) {
            console.error(
              `❌ Impossible de supprimer l'émoji ${emoji.name} :`,
              err,
            );
          }
        }
      } else if (systeme === "jail") {
        const imageUrl = `https://skins.nationsglory.fr/body/ToStam/3d/4?vr=-20&hr=10&hrh=20&vrla=50&vrra=-10&vrll=-10&vrrl=20&ratio=12&format=png&displayHair=true&headOnly=false&layers=false`;
        let imageBuffer = null;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(imageUrl, {
            signal: controller.signal,
          });

          clearTimeout(timeout);

          if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            const image = await loadImage(buffer);

            const canvas = createCanvas(image.width, image.height);
            const ctx = canvas.getContext("2d");

            ctx.scale(-1, 1);
            ctx.drawImage(image, -image.width, 0);

            imageBuffer = canvas.toBuffer();
          }
        } catch (err) {}

        const embed = new EmbedBuilder()
          .setTitle("🚧 Jail sur ToStam")
          .setColor(config.couleur[serveur])
          .setDescription(
            "**Durée** : 6 heures\n**Lien de la plainte :** [Clic Ici](https://nationsglory.fr/forums/thread/plainte-n2201-tnt-illegal-hyco75-contre-timobest.132338)",
          )
          .setFooter({ text: config.footer });

        if (imageBuffer) {
          embed.setThumbnail("attachment://modele.png");
        }

        const buttonFinish = new ButtonBuilder()
          .setCustomId("jail_previsualisation_finish")
          .setLabel("Jail Effectué")
          .setStyle(ButtonStyle.Success);
        const buttonLink = new ButtonBuilder()
          .setLabel("Aller sur la plainte")
          .setStyle(ButtonStyle.Link)
          .setURL(
            "https://nationsglory.fr/forums/thread/plainte-n2201-tnt-illegal-hyco75-contre-timobest.132338",
          );

        const actionRow = new ActionRowBuilder().addComponents(
          buttonFinish,
          buttonLink,
        );

        const files = imageBuffer
          ? [{ attachment: imageBuffer, name: "modele.png" }]
          : [];

        return interaction.reply({
          embeds: [embed],
          files,
          components: [actionRow],
          ephemeral: true,
        });
      } else if (systeme === "Pays Pillable ( 14h )") {
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

        await interaction.deferReply({ ephemeral: true });

        const guild = await client.guilds.fetch("1349379748576366633");
        const createdEmojis = [];

        async function formatCountriesWithFlags(list) {
          const result = [];
          for (const country of list) {
            const emoji = await getCountryEmoji(
              guild,
              serveur,
              country.name,
              config,
            );
            if (emoji) {
              createdEmojis.push(emoji);
              result.push(`<:${emoji.name}:${emoji.id}> ${country.name}`);
            } else {
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
          const formatted = await formatCountriesWithFlags(inactiveCountries);
          description += `\n\n**Inactivité :**\n${formatted}`;
        }
        if (fhomeCountries.length > 0) {
          const formatted = await formatCountriesWithFlags(fhomeCountries);
          description += `\n\n**F Home :**\n${formatted}`;
        }

        description +=
          "\n\nCes pays sont désormais disponible au pillage. C'est-à-dire que vous pouvez vous rendre dans ces pays et récupérer l'intégralité des ressources disponibles dans les coffres et ainsi casser des blocs. Il faut savoir que les pays sont pillables à partir de 14h, ils sont régénérés et supprimés à 18h.\n\nVoici les 4 différentes raisons de disband :\n- Inactivité du chef et du/des officier(s) de plus de 14 jours\n- Pays ayant moins de 6 membres\n- Pays sans fhome durant une semaine consécutive\n- Inactivité au serveur du pays durant plus d'un mois, après la mise en garde du staff\n\nSi tu ne peux pas te connecter pendant un long moment et tu as peur de te faire disband, alors effectue la commande ```/f absence add <vacation/other> <JJ/MM/YYYY de début> <JJ/MM/YYYY de fin>```";

        if (
          inactiveCountries.length == 0 &&
          memberCountries.length == 0 &&
          fhomeCountries.length == 0
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

        await interaction.editReply({
          embeds: [embed],
          components: [actionRow],
          ephemeral: true,
        });
        for (const emoji of createdEmojis) {
          try {
            await emoji.delete();
          } catch (err) {
            console.error(
              `❌ Impossible de supprimer l'émoji ${emoji.name} :`,
              err,
            );
          }
        }
      } else if (systeme === "Pays Disband ( 18h15 )") {
        await interaction.deferReply({ ephemeral: true });
        const responseJson = await fetch(
          `https://apiv2.nationsglory.fr/mods/country_list/${serveur}`,
        );
        const addedJsonCountries = await responseJson.json();

        const addedHtmlCountries = await fetchAndParseCountriesHTML(serveur);

        const today = DateTime.local().setLocale("fr");
        const todayHtmlCountries = addedHtmlCountries.filter((c) => {
          const parsedDate = DateTime.fromFormat(c.date, "d LLLL yyyy", {
            locale: "fr",
          });
          return parsedDate.hasSame(today, "day");
        });

        let description =
          "L'intégralité des pays qui étaient disponibles au pillage à 14h ont été supprimés.";

        const guild = await client.guilds.fetch("1349379748576366633");
        const createdEmojis = [];

        console.log("Création des émojis JSON...");

        const formattedJsonCountries = [];
        for (const c of addedJsonCountries.sort((a, b) =>
          a.name.localeCompare(b.name),
        )) {
          const flagEmoji = await getCountryEmoji(
            guild,
            serveur,
            c.name,
            config,
          );
          if (flagEmoji) createdEmojis.push(flagEmoji);

          const flag = flagEmoji ? `<:${flagEmoji.name}:${flagEmoji.id}> ` : "";
          formattedJsonCountries.push(`${flag}${c.name}`);
        }

        if (formattedJsonCountries.length > 0) {
          description += `\n\n${formattedJsonCountries.join("\n")}`;
        }

        console.log("Fin de la création des émojis JSON !");
        console.log(todayHtmlCountries);

        const formattedHtmlCountries = [];
        for (const c of todayHtmlCountries.sort((a, b) =>
          a.nom.localeCompare(b.nom),
        )) {
          console.log("Chef en cours :", c.chef);
          console.log("Pays en cours :", c.nom);
          const flagEmoji = await getCountryEmoji(
            guild,
            serveur,
            c.nom,
            config,
          );
          if (flagEmoji) createdEmojis.push(flagEmoji);

          console.log("Emoji pays good");

          let headEmoji = null;
          if (c.chef) {
            const imageUrl = `https://skins.nationsglory.fr/face/${c.chef}/3d/15`;

            try {
              headEmoji = await guild.emojis.create(imageUrl, `head_${c.chef}`);
              createdEmojis.push(headEmoji);
            } catch (err) {
              console.error(
                `Erreur lors de la création de l'émoji tête pour ${c.chef}:`,
                err,
              );
            }
          }

          console.log("Emoji chef good");

          const flag = flagEmoji ? `<:${flagEmoji.name}:${flagEmoji.id}> ` : "";
          const head = headEmoji ? `<:${headEmoji.name}:${headEmoji.id}> ` : "";
          const leaderInfo = c.chef ? `\n↪ Créé par ${head}${c.chef}` : "";

          formattedHtmlCountries.push(`${flag}${c.nom}${leaderInfo}`);
        }

        if (formattedHtmlCountries.length > 0) {
          description += `\n${formattedHtmlCountries.join("\n")}`;
        }

        console.log("Fin de la création des émojis HTML !");

        const embed = new EmbedBuilder()
          .setTitle("💥 Les pays sont supprimés !")
          .setDescription(description)
          .setColor(config.couleur[serveur])
          .setFooter({ text: config.footer });

        interaction.editReply({ embeds: [embed], ephemeral: true });

        for (const emoji of createdEmojis) {
          try {
            await emoji.delete();
          } catch (err) {
            console.error(
              `❌ Impossible de supprimer l'émoji ${emoji.name} :`,
              err,
            );
          }
        }
      } else if (systeme === "Attente Staff") {
        const embed = new EmbedBuilder()
          .setTitle("🕓 Attente Staff")
          .setDescription(
            `Le joueur **${interaction.user.displayName}** (<@${interaction.user.id}>) attend dans <#${config.attentestaff[serveur]}>.`,
          )
          .setColor(config.couleur[serveur])
          .setFooter({ text: config.footer });

        return interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
      } else {
        const embed = new EmbedBuilder()
          .setTitle(
            `Prévisualisation - ${systeme
              .charAt(0)
              .toUpperCase()}${systeme.slice(1)}`,
          )
          .setColor(config.couleur[serveur])
          .setDescription(
            "Aucune prévisualisation n'est disponible pour pour ce système.",
          )
          .setFooter({ text: config.footer });

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      console.error(
        "Erreur lors de la gestion de la prévisualisation :",
        error,
      );
      return interaction.reply({
        content: `Une erreur est survenue lors de la prévisualisation du module : ${error}`,
        ephemeral: true,
      });
    }
  },
};
