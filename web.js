const express = require("express");
const { getData } = require("./util/module/getAndSaveData");
const { discordStaff, discordLink } = require("./util/module/discordLink");
const { AttenteStaff } = require("./util/container/module");
const { getEmojiTete } = require("./util/module/emoji");
const bodyParser = require("body-parser");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  WebhookClient,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("./config");
const { client } = require("./main");
const attentestaff = require("./util/attentestaff");
const rank = require("./util/rank");
const os = require("os");
const util = require("util");
const readFile = util.promisify(fs.readFile);

async function updateAllStaffWebhooks() {
  function normalizeRoleKey(role) {
    return role
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s-]+/g, "_");
  }
  for (const serveur of config.liste_serveur) {
    const basePath = path.join(__dirname, "data", serveur);
    const configPath = path.join(basePath, "webhookListeDesStaffs.json");
    const staffFilePath = path.join(basePath, "staff-serveur.json");

    if (!fs.existsSync(configPath)) continue;

    let config;
    try {
      const rawConfig = await readFile(configPath, "utf8");
      config = JSON.parse(rawConfig);
    } catch (err) {
      console.warn(
        `Erreur de lecture du fichier config pour ${serveur} :`,
        err,
      );
      continue;
    }

    let staffData = null;
    let lastUpdated = null;
    try {
      const staffRaw = await readFile(staffFilePath, "utf8");
      staffData = JSON.parse(staffRaw);
      lastUpdated = staffData.timestamp;
    } catch (e) {
      console.warn(`Impossible de lire ou parser ${staffFilePath}`, e);
    }

    const replacePlaceholders = (text) => {
      if (!staffData) return text;
      let replaced = text;
      Object.entries(staffData).forEach(([role, users]) => {
        if (!Array.isArray(users)) return;
        const normalizedRole = normalizeRoleKey(role);
        replaced = replaced.replace(
          new RegExp(`{${normalizedRole}}`, "gi"),
          users.map((u) => u.replace(/_/g, "\\_")).join(", "),
        );
        replaced = replaced.replace(
          new RegExp(`{${normalizedRole}_nombre}`, "gi"),
          String(users.length),
        );
      });
      replaced = replaced.replace(
        /{timestamp}/gi,
        lastUpdated ? String(lastUpdated) : "",
      );
      return replaced;
    };

    const {
      messageId,
      webhookUrl,
      titre,
      description: rawDescription,
      footerTexte,
      footerImage,
      image,
      thumbnail,
      couleur,
      auteurNom,
      auteurUrl,
    } = config;

    const description = replacePlaceholders(rawDescription || "");

    const embed = new EmbedBuilder().setColor(couleur || "#0099ff");

    if (titre) embed.setTitle(titre);
    if (description) embed.setDescription(description);
    if (footerTexte || footerImage)
      embed.setFooter({
        text: footerTexte || "",
        iconURL: footerImage || undefined,
      });
    if (image) embed.setImage(image);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (auteurNom || auteurUrl)
      embed.setAuthor({
        name: auteurNom || "",
        url: auteurUrl || undefined,
      });

    if (!webhookUrl) {
      console.warn(`webhookUrl manquant pour ${serveur}`);
      continue;
    }

    const [webhookId, webhookToken] = webhookUrl.split("/").slice(-2);
    const webhookClient = new WebhookClient({
      id: webhookId,
      token: webhookToken,
    });

    try {
      if (messageId) {
        try {
          await webhookClient.editMessage(messageId, { embeds: [embed] });
        } catch (editError) {
          console.warn(
            `Erreur modification message (${serveur}), envoi nouveau...`,
            editError,
          );
          const sent = await webhookClient.send({ embeds: [embed] });
          config.messageId = sent.id;
        }
      } else {
        const sent = await webhookClient.send({ embeds: [embed] });
        config.messageId = sent.id;
      }

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
      console.log(`✅ ${serveur} : embed mis à jour.`);
    } catch (err) {
      console.error(`❌ ${serveur} : erreur d’envoi du webhook :`, err);
    }
  }
}

function parseFrDate(dateStr) {
  const [day, monthLabel, year] = dateStr.split(" ");
  const months = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];
  const month = months.indexOf(monthLabel);
  return new Date(parseInt(year), month, parseInt(day));
}

const app = express();
const port = 21319;

app.use(bodyParser.json());

app.get("/api/statuts", (req, res) => {
  try {
    const uptimeSeconds = os.uptime();
    const uptimeFormatted = new Date(uptimeSeconds * 1000)
      .toISOString()
      .substr(11, 8);

    const cpuLoad = os.loadavg()[0];
    const cpuUsage = (cpuLoad / os.cpus().length) * 100;

    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const ramUsage = (usedMemory / totalMemory) * 100;

    const isOnline = true;

    res.json({
      statut: isOnline ? "En ligne" : "Hors ligne",
      uptime: uptimeFormatted,
      cpu: `${cpuUsage.toFixed(2)}%`,
      ram: `${ramUsage.toFixed(2)}%`,
      load_average: cpuLoad.toFixed(2),
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des statistiques." });
  }
});

app.post("/staff", async (req, res) => {
  const staffData = req.body;

  if (Array.isArray(staffData)) {
    const promotions = [];
    for (const serverData of staffData) {
      const serveur = serverData.serveur;

      const processedData = {
        Administrateur: serverData.administrateur,
        "Super-Modérateur": serverData.super_moderateur,
        "Modérateur Plus": serverData.moderateur_plus,
        Modérateur: serverData.moderateur,
        "Modérateur Test": serverData.moderateur_test,
        Guide: serverData.guide,
      };

      const allStaffList = Object.values(processedData).flat().filter(Boolean);

      const staffDirectoryPath = path.join(__dirname, "data", "staff");
      if (!fs.existsSync(staffDirectoryPath)) {
        fs.mkdirSync(staffDirectoryPath, { recursive: true });
      }

      const staffServerDir = path.join(__dirname, "data", serveur, "staff");
      if (!fs.existsSync(staffServerDir)) {
        fs.mkdirSync(staffServerDir, { recursive: true });
      }

      const existingFiles = fs
        .readdirSync(staffServerDir)
        .filter((f) => f.endsWith(".json"));

      for (const file of existingFiles) {
        const staffName = path.basename(file, ".json");
        if (!allStaffList.includes(staffName)) {
          fs.unlinkSync(path.join(staffServerDir, file));
          console.log(`🗑️ Fichier supprimé : ${file}`);
        }
      }

      for (const role in processedData) {
        processedData[role].forEach((staffName) => {
          if (staffName) {
            const filePath = path.join(
              __dirname,
              "data",
              serveur,
              "staff",
              `${staffName}.json`,
            );

            if (!fs.existsSync(filePath)) {
              fs.mkdirSync(path.dirname(filePath), { recursive: true });

              fs.writeFileSync(filePath, "{}", "utf8");
              console.log(`📕 Fichier créé : ${filePath}`);
            }

            const staffFilePath = path.join(
              staffDirectoryPath,
              `${staffName}.json`,
            );
            let staffData = {};

            const staffFileExisted = fs.existsSync(staffFilePath);
            if (staffFileExisted) {
              try {
                staffData = JSON.parse(fs.readFileSync(staffFilePath, "utf8"));
              } catch (e) {
                console.error("Erreur avec le fichier", staffName);
              }
            }

            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            });

            let lastEntryForServer = null;

            for (const date of Object.keys(staffData)) {
              const entry = staffData[date];

              if (entry.serveur === serveur) {
                if (
                  !lastEntryForServer ||
                  parseFrDate(date) > parseFrDate(lastEntryForServer.date)
                ) {
                  lastEntryForServer = { date, grade: entry.grade };
                }
              }
            }

            const isSameAsLast =
              lastEntryForServer && lastEntryForServer.grade === role;

            if (!isSameAsLast) {
              staffData[formattedDate] = {
                serveur,
                grade: role,
              };
              console.log(
                `➕ Ajout du rôle "${role}" à l'historique pour ${staffName} sur le serveur ${serveur} le ${formattedDate}`,
              );

              const wasJoueur =
                !lastEntryForServer || lastEntryForServer.grade === "Joueur";

              if (wasJoueur && role !== "Joueur") {
                promotions.push({
                  staff: staffName,
                  nouveau: role,
                  serveur,
                });
              }
            }

            fs.writeFileSync(
              staffFilePath,
              JSON.stringify(staffData, null, 2),
              "utf8",
            );
          }
        });
      }

      const allStaffFiles = fs
        .readdirSync(staffDirectoryPath)
        .filter((file) => file.endsWith(".json"));

      for (const staffFile of allStaffFiles) {
        const staffName = path.basename(staffFile, ".json");
        const staffFilePath = path.join(staffDirectoryPath, staffFile);

        let staffData = {};
        try {
          staffData = JSON.parse(fs.readFileSync(staffFilePath, "utf8"));
        } catch (e) {
          console.error("❌ JSON invalide dans", staffFilePath, e.message);
        }
        const dates = Object.keys(staffData).sort(
          (a, b) => new Date(a) - new Date(b),
        );
        const lastDate = dates.length > 0 ? dates[dates.length - 1] : null;

        const stillInStaff = Object.values(processedData).some((staffList) =>
          staffList.includes(staffName),
        );

        if (
          !stillInStaff &&
          lastDate &&
          staffData[lastDate].serveur === serveur &&
          staffData[lastDate].grade !== "Joueur"
        ) {
          const currentDate = new Date();
          const formattedDate = currentDate.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          });

          staffData[formattedDate] = {
            serveur: serveur,
            grade: "Joueur",
          };

          console.log(
            `➖ Déclassement de ${staffName} en "Joueur" sur le serveur ${serveur} le ${formattedDate}`,
          );

          fs.writeFileSync(
            staffFilePath,
            JSON.stringify(staffData, null, 2),
            "utf8",
          );
        }
      }

      const serverFilePath = path.join(
        __dirname,
        "data",
        serveur,
        `staff-serveur.json`,
      );

      const serverDirectory = path.dirname(serverFilePath);
      if (!fs.existsSync(serverDirectory)) {
        fs.mkdirSync(serverDirectory, { recursive: true });
      }

      processedData.timestamp = Math.floor(Date.now() / 1000);

      fs.writeFileSync(
        serverFilePath,
        JSON.stringify(processedData, null, 2),
        "utf8",
      );
      console.log(`✅ Données sauvegardées pour le serveur ${serveur}`);

      const dataFile = getData(`data/${serveur}/config.json`);
      const configStaff = dataFile.find((c) => c.nom === "Staff");
      const configAffichage = configStaff.systeme["Affichage Staff"];

      const escapeUnderscore = (text) => text.replace(/_/g, "\\_");

      const effectifRole = (role) => {
        const members = processedData[role].filter(
          (name) => name.trim() !== "",
        );
        return members.length;
      };

      const description = `
                                    **${
                                      config.emojigrade["Administrateur"]
                                    } Administrateurs (${effectifRole(
                                      "Administrateur",
                                    )}) :**\n${
                                      processedData["Administrateur"].join(
                                        ", ",
                                      ) || "Aucun"
                                    }
                                    \n**${
                                      config.emojigrade["Super-Modérateur"]
                                    } Super Modérateurs (${effectifRole(
                                      "Super-Modérateur",
                                    )}) :**\n${escapeUnderscore(
                                      processedData["Super-Modérateur"].join(
                                        ", ",
                                      ) || "Aucun",
                                    )}
                                    \n**${
                                      config.emojigrade["Modérateur Plus"]
                                    } Modérateurs Plus (${effectifRole(
                                      "Modérateur Plus",
                                    )}) :**\n${escapeUnderscore(
                                      processedData["Modérateur Plus"].join(
                                        ", ",
                                      ) || "Aucun",
                                    )}
                                    \n**${
                                      config.emojigrade["Modérateur"]
                                    } Modérateurs (${effectifRole(
                                      "Modérateur",
                                    )}) :**\n${escapeUnderscore(
                                      processedData["Modérateur"].join(", ") ||
                                        "Aucun",
                                    )}
                                    \n**${
                                      config.emojigrade["Modérateur Test"]
                                    } Modérateurs Tests (${effectifRole(
                                      "Modérateur Test",
                                    )}) :**\n${escapeUnderscore(
                                      processedData["Modérateur Test"].join(
                                        ", ",
                                      ) || "Aucun",
                                    )}
                                    \n**${
                                      config.emojigrade["Guide"]
                                    } Guides (${effectifRole(
                                      "Guide",
                                    )}) :**\n${escapeUnderscore(
                                      processedData["Guide"].join(", ") ||
                                        "Aucun",
                                    )}
                                    \n\n*Dernière mise à jour : <t:${Math.floor(
                                      Date.now() / 1000,
                                    )}:R>*
                                `;

      const staffEmbed = new EmbedBuilder()
        .setAuthor({
          name: `Staff du serveur ${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }`,
          url: `https://nationsglory.fr/server/${serveur}/staff`,
        })
        .setThumbnail(`${config.glorybot_url}/api/banniere?serveur=${serveur}`)
        .setColor(config.couleur[serveur])
        .setDescription(description)
        .setFooter({ text: config.footer });

      for (const [guildId, isActive] of Object.entries(
        configAffichage.active,
      )) {
        if (!isActive) continue;

        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;

        const channelId = configAffichage.Salon.valeur[guildId];
        if (!channelId) continue;

        const channel = guild.channels.cache.get(channelId);
        if (!channel) continue;

        const message = await channel.messages.fetch(
          configAffichage.Message[guildId],
        );
        if (!message) continue;

        try {
          await message.edit({ embeds: [staffEmbed] });

          console.log(
            `✅ Message effectif staff modifié | serveur ${serveur} | guild ${guildId}`,
          );
        } catch (err) {
          console.error(
            `❌ Erreur modification effectif staff | serveur ${serveur} | guild ${guildId}`,
            err,
          );
        }
      }
    }

    if (promotions.length > 0) {
      const linkData = (await discordLink(false)).data;
      const webhookUrl =
        "https://discord.com/api/webhooks/1457682599664160839/E80BsT3fA1zN4DLIli82PqTWt-hjN8rFtcJyHb-K4gO2C6H_HZjtqoessoybjixwwYgV";

      const message = promotions
        .map((p) => {
          const discordId = Object.keys(linkData).find(
            (id) => linkData[id] === p.staff,
          );

          return `${config.emoji_formate[p.serveur]} \`\`${p.staff}\`\` ${
            discordId ? `(\`\`${discordId}\`\`) ` : ""
          }devient ${p.nouveau}`;
        })
        .join("\n");

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: message,
        }),
      });
    }

    updateAllStaffWebhooks();
    res.status(200).json({
      message: "Données reçues et sauvegardées avec succès.",
    });
  } else {
    res.status(400).json({
      error: "Les données envoyées ne sont pas au format attendu.",
    });
  }
});

app.get("/historique", (req, res) => {
  const { staff, serveur, date } = req.query;

  if (!staff) {
    return res.status(400).json({ error: 'Le paramètre "staff" est requis.' });
  }

  const dataFilePath = path.join(__dirname, "data", "staff", `${staff}.json`);

  fs.readFile(dataFilePath, "utf8", (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ error: 'Le paramètre "staff" est invalide.' });
    }
    try {
      const jsonData = JSON.parse(data);
      const sortedDates = Object.keys(jsonData)
        .map((d) => ({
          dateStr: d,
          dateObj: new Date(d.split(" ").reverse().join("-")),
        }))
        .sort((a, b) => a.dateObj - b.dateObj);

      if (date) {
        const parsedDate = new Date(date.split("-").reverse().join("-"));
        let closestEntries = sortedDates.filter((d) => d.dateObj <= parsedDate);

        if (closestEntries.length > 0) {
          const result = {};
          closestEntries.forEach((entry) => {
            result[entry.dateStr] = jsonData[entry.dateStr];
          });

          if (serveur) {
            for (const dateKey in result) {
              if (result[dateKey].serveur !== serveur) {
                delete result[dateKey];
              }
            }
          }

          return res.json(result);
        } else {
          return res.json({
            message: "Aucune donnée disponible avant cette date.",
          });
        }
      }

      if (serveur) {
        const filteredData = Object.fromEntries(
          Object.entries(jsonData).filter(
            ([_, value]) => value.serveur === serveur,
          ),
        );
        return res.json(filteredData);
      }

      res.json(jsonData);
    } catch (parseErr) {
      res
        .status(500)
        .json({ message: "Erreur de l'API, veuillez contacter ToStam." });
      console.log(parseErr);
    }
  });
});

app.post("/update-leaders", async (req, res) => {
  const filePath = path.join(__dirname, "data", "doublelead.json");
  const newData = req.body;

  fs.readFile(filePath, "utf8", (err, data) => {
    let existingData = [];

    if (!err) {
      try {
        existingData = JSON.parse(data);
      } catch (parseErr) {
        return res.status(500).json({ error: "Error parsing file" });
      }
    }

    const newDataMap = new Map(newData.map((entry) => [entry.leader, entry]));

    const updatedData = existingData
      .map((entry) => {
        if (newDataMap.has(entry.leader)) {
          const newEntry = newDataMap.get(entry.leader);
          newEntry.servers = newEntry.servers;
          newEntry.alerteServeur = entry.alerteServeur || [];
          return newEntry;
        }
        return null;
      })
      .filter((entry) => entry !== null);

    newData.forEach((entry) => {
      if (!entry.alerteServeur) {
        entry.alerteServeur = [];
      }
      if (!existingData.some((e) => e.leader === entry.leader)) {
        updatedData.push(entry);
      }
    });

    const multiServerLeaders = updatedData
      .filter(
        (entry) => Array.isArray(entry.servers) && entry.servers.length > 1,
      )
      .map((entry) => ({
        leader: entry.leader,
        servers: entry.servers,
      }));

    fs.writeFile(
      filePath,
      JSON.stringify(updatedData, null, 2),
      "utf8",
      async (writeErr) => {
        if (writeErr) {
          return res.status(500).json({ error: "Error writing file" });
        }

        for (const { leader, servers } of multiServerLeaders) {
          const updatedEntry = updatedData.find(
            (entry) => entry.leader === leader,
          );

          const eligibleServersMap = new Map();
          for (const { server } of servers) {
            const normalizedServer = server.toLowerCase();
            if (eligibleServersMap.has(normalizedServer)) continue;

            const dataFile = getData(`data/${server}/config.json`);
            const configData = dataFile.find((c) => c.nom === "Double Lead");
            const serverConfig = configData.systeme.doublelead;
            if (!updatedEntry.alerteServeur.find((a) => a.server === server)) {
              eligibleServersMap.set(normalizedServer, serverConfig);
            }
          }

          if (eligibleServersMap.size === 0) continue;

          const leaderPseudos = [...new Set(servers.map((s) => s.compte))];
          let message;

          if (leaderPseudos.length === 1) {
            const emoji = await getEmojiTete(client, leaderPseudos[0]);
            message = `Le joueur ${emoji} **${leaderPseudos[0]}** possède différents pays :\n`;
          } else if (leaderPseudos.length === 2) {
            const [p1, p2] = leaderPseudos;
            const [e1, e2] = await Promise.all([
              getEmojiTete(client, p1),
              getEmojiTete(client, p2),
            ]);
            message = `Les joueurs ${e1} **${p1}** et ${e2} **${p2}** possèdent différents pays :\n`;
          } else {
            const last = leaderPseudos.pop();
            const emojis = await Promise.all(
              leaderPseudos.map((p) => getEmojiTete(client, p)),
            );
            const lastEmoji = await getEmojiTete(client, last);
            message = `Les joueurs ${leaderPseudos
              .map((p, i) => `${emojis[i]} **${p}**`)
              .join(
                ", ",
              )} et ${lastEmoji} **${last}** possèdent différents pays :\n`;
          }

          for (const { compte, server, country } of servers) {
            const emojiCompte = await getEmojiTete(client, compte);
            message += `<:NG${
              server.charAt(0).toUpperCase() + server.slice(1)
            }:${config.emoji[server.toLowerCase()]}> **${
              server.charAt(0).toUpperCase() + server.slice(1)
            }** : ${country} (${emojiCompte} ${compte})\n`;
          }

          for (const [server, serverConfig] of eligibleServersMap.entries()) {
            const container = new ContainerBuilder()
              .setAccentColor(config.couleur[server])
              .addTextDisplayComponents((t) =>
                t.setContent(`## 🏴 Double Lead`),
              )
              .addSeparatorComponents((s) => s)
              .addTextDisplayComponents((t) => t.setContent(message));

            for (const [guildId, isActive] of Object.entries(
              serverConfig.active,
            )) {
              if (!isActive) continue;

              const guild = client.guilds.cache.get(guildId);
              if (!guild) continue;

              const channelId = serverConfig.Salon.valeur[guildId];
              if (!channelId) continue;

              const channel = guild.channels.cache.get(channelId);
              if (!channel) continue;

              if (updatedEntry.alerteServeur.find((a) => a.server === server))
                continue;

              const roleIds = serverConfig.Role.valeur[guildId] || [];
              const roleMentions = roleIds.map((id) => `<@&${id}>`).join(" ");

              let components = [container];
              if (roleMentions.length > 0) {
                components = [
                  new TextDisplayBuilder().setContent(roleMentions),
                  container,
                ];
              }

              try {
                const sentMessage = await channel.send({
                  components,
                  flags: MessageFlags.IsComponentsV2,
                });

                if (channel.type === "GUILD_NEWS") {
                  await sentMessage.crosspost();
                }

                console.log(
                  `✅ Message double lead envoyé | serveur ${server} | guild ${guildId}`,
                );

                updatedEntry.alerteServeur.push({ server, guildId });
              } catch (err) {
                console.error(
                  `❌ Erreur envoi double lead | serveur ${server} | guild ${guildId}`,
                  err,
                );
              }
            }
          }
        }

        fs.writeFile(
          filePath,
          JSON.stringify(updatedData, null, 2),
          "utf8",
          (finalWriteErr) => {
            if (finalWriteErr) {
              return res
                .status(500)
                .json({ error: "Error updating alert data" });
            }
            res.json({ message: "File updated successfully" });
          },
        );
      },
    );
  });
});

app.post("/tempsdejeu", (req, res) => {
  const { date, serveurs } = req.body;

  if (!date || !serveurs) {
    return res.status(400).json({ error: "Payload invalide" });
  }

  for (const [serveur, joueurs] of Object.entries(serveurs)) {
    const staffDir = path.join(__dirname, "data", serveur, "staff");
    const serveurDir = path.join(
      __dirname,
      "data",
      serveur,
      "tempsdejeu",
      `${date}.json`,
    );
    fs.writeFileSync(serveurDir, JSON.stringify(joueurs, null, 2), "utf8");

    if (!fs.existsSync(staffDir)) {
      console.warn(
        `Dossier staff introuvable pour le serveur ${serveur}, on passe`,
      );
      continue;
    }

    for (const [pseudo, temps] of Object.entries(joueurs)) {
      const joueurFilePath = path.join(staffDir, `${pseudo}.json`);

      if (!fs.existsSync(joueurFilePath)) {
        continue;
      }

      try {
        const joueurData = JSON.parse(fs.readFileSync(joueurFilePath, "utf8"));

        if (!joueurData["temps-de-jeu"]) {
          joueurData["temps-de-jeu"] = {};
        }

        joueurData["temps-de-jeu"][date] = temps;

        fs.writeFileSync(
          joueurFilePath,
          JSON.stringify(joueurData, null, 2),
          "utf8",
        );
      } catch (err) {
        console.error(`Erreur sur ${pseudo} du serveur ${serveur}:`, err);
      }
    }
    console.log(`✅ Temps de jeu ajouté pour le serveur ${serveur} !`);
  }

  res
    .status(200)
    .json({ message: "Données de temps de jeu traitées avec succès." });
});

app.get("/api/get-staff", async (req, res) => {
  const discordId = req.query.discordId;

  if (!discordId || typeof discordId !== "string") {
    return res.status(400).json({ error: "Missing or invalid pseudo" });
  }

  try {
    if (discordId === "719072181631320145") {
      return res.status(200).json(config.liste_serveur);
    }

    const { servers } = await discordStaff(
      discordId,
      "all",
      "super_moderateur",
    );

    return res.status(200).json(servers);
  } catch (error) {
    console.error("Error in /api/get-staff:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/webhookListeDesStaffs/:serveur", (req, res) => {
  const authHeader = req.headers.authorization;

  const TOKEN = "33:$+gj{csMS75.,9sWd7?^rVaE9%7HMRcU3Pj-8";

  if (!authHeader || authHeader !== `Bearer ${TOKEN}`) {
    return res.status(401).json({ error: "Accès non autorisé" });
  }

  const serveur = req.params.serveur;
  const filePath = path.join(
    __dirname,
    "data",
    serveur,
    "webhookListeDesStaffs.json",
  );

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        return res
          .status(404)
          .json({ error: `Fichier pour serveur ${serveur} non trouvé` });
      }
      return res
        .status(500)
        .json({ error: "Erreur serveur lors de la lecture du fichier" });
    }

    try {
      const json = JSON.parse(data);
      return res.json(json);
    } catch (e) {
      return res.status(500).json({ error: "Fichier JSON corrompu" });
    }
  });
});

app.post("/webhookListeDesStaffs/:serveur", async (req, res) => {
  const authHeader = req.headers.authorization;

  const TOKEN = "33:$+gj{csMS75.,9sWd7?^rVaE9%7HMRcU3Pj-8";

  if (!authHeader || authHeader !== `Bearer ${TOKEN}`) {
    return res.status(401).json({ error: "Accès non autorisé" });
  }

  const serveur = req.params.serveur;
  const filePath = path.join(
    __dirname,
    "data",
    serveur,
    "webhookListeDesStaffs.json",
  );
  const staffFilePath = path.join(
    __dirname,
    "data",
    serveur,
    "staff-serveur.json",
  );
  const {
    messageId,
    webhookUrl,
    titre,
    description: rawDescription,
    footerTexte,
    footerImage,
    image,
    thumbnail,
    couleur,
    auteurNom,
    auteurUrl,
  } = req.body;

  function normalizeRoleKey(role) {
    return role
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s-]+/g, "_");
  }

  let staffData = null;
  let lastUpdated = null;

  try {
    const staffRaw = await readFile(staffFilePath, "utf8");
    staffData = JSON.parse(staffRaw);
    lastUpdated = staffData.timestamp;
  } catch (e) {
    console.warn(`Impossible de lire ou parser ${staffFilePath}`, e);
  }

  const replacePlaceholders = (text) => {
    if (!staffData) return text;

    let replaced = text;

    Object.entries(staffData).forEach(([role, users]) => {
      if (!Array.isArray(users)) return;
      const normalizedRole = normalizeRoleKey(role);

      replaced = replaced.replace(
        new RegExp(`{${normalizedRole}}`, "gi"),
        users.map((u) => u.replace(/_/g, "\\_")).join(", "),
      );

      replaced = replaced.replace(
        new RegExp(`{${normalizedRole}_nombre}`, "gi"),
        String(users.length),
      );
    });

    replaced = replaced.replace(
      /{timestamp}/gi,
      lastUpdated ? String(lastUpdated) : "",
    );

    return replaced;
  };

  const description = replacePlaceholders(rawDescription || "");

  const embed = new EmbedBuilder().setColor(couleur || "#0099ff");

  if (titre) embed.setTitle(titre);
  if (description) embed.setDescription(description || "");
  if (footerTexte || footerImage) {
    embed.setFooter({
      text: footerTexte || "",
      iconURL: footerImage || undefined,
    });
  }
  if (image) {
    embed.setImage(image);
  }
  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  }
  if (auteurNom || auteurUrl) {
    embed.setAuthor({ name: auteurNom || "", url: auteurUrl || undefined });
  }

  function saveFile(data) {
    return new Promise((resolve, reject) => {
      fs.mkdir(path.dirname(filePath), { recursive: true }, (err) => {
        if (err) return reject(err);

        fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8", (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }

  try {
    if (!webhookUrl) {
      return res
        .status(400)
        .json({ error: "webhookUrl manquant dans la requête" });
    }

    const webhookParts = webhookUrl.split("/");
    const webhookId = webhookParts[webhookParts.length - 2];
    const webhookToken = webhookParts[webhookParts.length - 1];
    const webhookClient = new WebhookClient({
      id: webhookId,
      token: webhookToken,
    });

    if (messageId) {
      try {
        await webhookClient.editMessage(messageId, {
          embeds: [embed],
        });
        req.body.messageId = messageId;
      } catch (editError) {
        console.warn(
          "Erreur lors de la modification du message, on tente de poster un nouveau :",
          editError,
        );

        try {
          const sentMessage = await webhookClient.send({
            embeds: [embed],
          });
          req.body.messageId = sentMessage.id;
        } catch (sendError) {
          console.error(
            "Erreur lors de l'envoi du nouveau message :",
            sendError,
          );
          req.body.messageId = false;
          return res.status(500).json({
            error: "Erreur critique lors de l'envoi du message webhook.",
          });
        }
      }
    } else {
      const sentMessage = await webhookClient.send({
        embeds: [embed],
      });
      req.body.messageId = sentMessage.id;
    }

    await saveFile(req.body);

    return res.status(200).json({
      success: true,
      message: `Webhook ListeDesStaffs de ${serveur} mis à jour avec succès`,
      messageId: req.body.messageId,
    });
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi ou modification du message webhook :",
      error,
    );
    req.body.messageId = false;
    return res.status(500).json({
      error: "Erreur lors de l'envoi ou modification du message webhook",
    });
  }
});

app.get("/api/configuration", (req, res) => {
  const { serveur, systeme } = req.query;

  if (!serveur) {
    return res
      .status(400)
      .json({ error: 'Les paramètres "serveur" et "system" sont requis.' });
  }

  const authHeader = req.headers.authorization;

  const TOKEN = "33:$+gj{csMS75.,9sWd7?^rVaE9%7HMRcU3Pj-8";

  if (!authHeader || authHeader !== `Bearer ${TOKEN}`) {
    return res.status(401).json({ error: "Accès non autorisé" });
  }

  const serveurLower = serveur.toLowerCase();

  const dataFilePath = path.join(
    __dirname,
    "data",
    serveurLower,
    `config-${systeme}.json`,
  );

  fs.readFile(dataFilePath, "utf8", (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ error: 'Le paramètre "serveur" est invalide.' });
    }
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseErr) {
      res
        .status(500)
        .json({ message: "Erreur de l'API, veuillez contacter ToStam." });
    }
  });
});

app.get("/api/staff", (req, res) => {
  const { serveur } = req.query;

  if (!serveur) {
    return res
      .status(400)
      .json({ error: 'Le paramètre "serveur" est requis.' });
  }

  const authHeader = req.headers.authorization;

  const TOKEN = "33:$+gj{csMS75.,9sWd7?^rVaE9%7HMRcU3Pj-8";

  if (!authHeader || authHeader !== `Bearer ${TOKEN}`) {
    return res.status(401).json({ error: "Accès non autorisé" });
  }

  const serveurLower = serveur.toLowerCase();

  const dataFilePath = path.join(
    __dirname,
    "data",
    serveurLower,
    "staff-serveur.json",
  );

  fs.readFile(dataFilePath, "utf8", (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ error: 'Le paramètre "serveur" est invalide.' });
    }
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseErr) {
      res
        .status(500)
        .json({ message: "Erreur de l'API, veuillez contacter ToStam." });
    }
  });
});

app.get("/api/jail", async (req, res) => {
  const { serveur } = req.query;

  if (!serveur) {
    return res
      .status(400)
      .json({ error: 'Le paramètre "serveur" est requis.' });
  }

  const authHeader = req.headers.authorization;
  const TOKEN = "33:$+gj{csMS75.,9sWd7?^rVaE9%7HMRcU3Pj-8";

  if (!authHeader || authHeader !== `Bearer ${TOKEN}`) {
    return res.status(401).json({ error: "Accès non autorisé" });
  }

  const serveurLower = serveur.toLowerCase();
  const dataFilePath = path.join(__dirname, "data", serveurLower, "jail.json");
  const configFilePath = path.join(
    __dirname,
    "data",
    serveurLower,
    "config-jail.json",
  );

  try {
    const [dataContent, configContent] = await Promise.all([
      readFile(dataFilePath, "utf8"),
      readFile(configFilePath, "utf8"),
    ]);

    const jsonData = JSON.parse(dataContent);
    const configData = JSON.parse(configContent);

    const goodData = { jail: jsonData, active: configData.jail.active };

    res.json(goodData);
  } catch (err) {
    console.error(err);
    if (err.code === "ENOENT") {
      return res
        .status(500)
        .json({ error: 'Le paramètre "serveur" est invalide.' });
    } else {
      return res
        .status(500)
        .json({ message: "Erreur de l'API, veuillez contacter ToStam." });
    }
  }
});

app.get("/api/routine", async (req, res) => {
  const { serveur } = req.query;

  if (!serveur) {
    return res
      .status(400)
      .json({ error: 'Le paramètre "serveur" est requis.' });
  }

  const authHeader = req.headers.authorization;
  const TOKEN = "33:$+gj{csMS75.,9sWd7?^rVaE9%7HMRcU3Pj-8";

  if (!authHeader || authHeader !== `Bearer ${TOKEN}`) {
    return res.status(401).json({ error: "Accès non autorisé" });
  }

  const serveurLower = serveur.toLowerCase();
  const dataFilePath = path.join(
    __dirname,
    "data",
    serveurLower,
    "routine.json",
  );
  const configFilePath = path.join(
    __dirname,
    "data",
    serveurLower,
    "config-routine.json",
  );

  try {
    const [dataContent, configContent] = await Promise.all([
      readFile(dataFilePath, "utf8"),
      readFile(configFilePath, "utf8"),
    ]);

    const jsonData = JSON.parse(dataContent);
    const configData = JSON.parse(configContent);

    const goodData = { routine: jsonData, active: configData.routine.active };

    res.json(goodData);
  } catch (err) {
    console.error(err);
    if (err.code === "ENOENT") {
      return res
        .status(500)
        .json({ error: 'Le paramètre "serveur" est invalide.' });
    } else {
      return res
        .status(500)
        .json({ message: "Erreur de l'API, veuillez contacter ToStam." });
    }
  }
});

app.get("/gestionStaff", async (req, res) => {
  const { serveur, staff } = req.query;

  if (!serveur || !staff) {
    return res
      .status(400)
      .json({ error: 'Les paramètres "serveur" et "staff" sont requis.' });
  }

  const authHeader = req.headers.authorization;
  const TOKEN = "33:$+gj{csMS75.,9sWd7?^rVaE9%7HMRcU3Pj-8";

  if (!authHeader || authHeader !== `Bearer ${TOKEN}`) {
    return res.status(401).json({ error: "Accès non autorisé" });
  }

  const serveurLower = serveur.toLowerCase();
  const dataFilePath = path.join(
    __dirname,
    "data",
    serveurLower,
    "staff",
    `${staff}.json`,
  );
  const rankFilePath = path.join(__dirname, "data", "staff", `${staff}.json`);

  try {
    const [dataContent, rankContent] = await Promise.all([
      readFile(dataFilePath, "utf8"),
      readFile(rankFilePath, "utf8"),
    ]);

    const jsonData = JSON.parse(dataContent);
    const rankData = JSON.parse(rankContent);

    jsonData.dateDeRank = rankData;

    res.json(jsonData);
  } catch (err) {
    console.error(err);
    if (err.code === "ENOENT") {
      return res
        .status(500)
        .json({ error: 'Le paramètre "serveur" est invalide.' });
    } else {
      return res
        .status(500)
        .json({ message: "Erreur de l'API, veuillez contacter ToStam." });
    }
  }
});

app.post("/api/attenteStaff", async (req, res) => {
  const { serveur, joueur, id, salon } = req.body;

  if (!serveur || !joueur || !id || !salon) {
    return res
      .status(400)
      .json({ error: "Champs manquants dans le corps de la requête." });
  }

  const configData = getData(`data/${serveur}/config.json`);
  const configAttenteStaff = configData.find((c) => c.nom === "Attente Staff");
  const module = configAttenteStaff.systeme["Attente Staff"];

  const container = await AttenteStaff(client, serveur, joueur, id, salon);

  for (const [guildId, isActive] of Object.entries(module.active)) {
    if (!isActive) continue;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    const channelId = module.Salon.valeur[guildId];
    if (!channelId) continue;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) continue;

    const roleIds = module.Role.valeur[guildId] || [];
    const roleMentions = roleIds.map((id) => `<@&${id}>`).join(" ");

    let components = [container];
    if (roleMentions.length > 0)
      components = [
        new TextDisplayBuilder().setContent(roleMentions),
        container,
      ];

    try {
      const sentMessage = await channel.send({
        components,
        flags: MessageFlags.IsComponentsV2,
      });

      if (channel.type === "GUILD_NEWS") await sentMessage.crosspost();

      console.log(
        `✅ Message attente staff | serveur ${serveur} | guild ${guildId}`,
      );
    } catch (err) {
      console.error(
        `❌ Erreur envoi disband 18h15 | serveur ${serveur} | guild ${guildId}`,
        err,
      );
    }
  }

  return res.status(200).json({ success: true });
});

app.post("/api/forumulaire_espilon_rp", async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).send("Aucune donnée reçue.");

    const [
      date,
      pseudoClient,
      pseudoCible,
      nombreAssassin,
      recupStuff,
      anonymisationClient,
      plusInfos,
      payement,
    ] = data.split(" | ");

    const configData = getData("data/epsilon/assassinat/config.json");
    const channel = await client.channels.fetch(configData.channelAssassinat);
    if (!channel || !channel.isTextBased()) {
      return res.status(400).send("Salon introuvable ou non textuel.");
    }

    const fileId = payement.split("id=")[1];
    const imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    const embed = new EmbedBuilder()
      .setTitle("📋 Nouvelle demande d'assassinat")
      .setDescription(
        `**Pseudo du Client :** ${pseudoClient}\n` +
          `**Pseudo de la Cible :** ${pseudoCible}\n` +
          `**Nombre d'Assassin :** ${nombreAssassin.split(" ")[0]}\n` +
          `**Récupération du Stuff :** ${recupStuff}\n` +
          `**Anonymisation du Client :** ${anonymisationClient}\n` +
          `**Plus d'Informations :** ${plusInfos}\n\n` +
          `*Prit en charge par personne*`,
      )
      .setColor(config.couleur["epsilon"])
      .setFooter({ text: config.footer })
      .setImage(imageUrl);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("assassinat_epsilon_prendre")
        .setLabel("Prendre en charge l'assassinat")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("assassinat_epsilon_kill")
        .setLabel("Kill effectué à 100%")
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("assassinat_epsilon_fin-echouee")
        .setLabel("Mission Echouée")
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),
    );

    const sentMessage = await channel.send({
      embeds: [embed],
      components: [row],
    });

    const filePath = path.join(
      __dirname,
      "data",
      "epsilon",
      "assassinat",
      "donnee.json",
    );

    let existingData = [];
    if (fs.existsSync(filePath)) {
      existingData = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    const newEntry = {
      messageId: sentMessage.id,
      date,
      pseudoClient,
      pseudoCible,
      nombreAssassin: nombreAssassin.split(" ")[0],
      listeAssassin: [],
      recupStuff,
      anonymisationClient,
      plusInfos,
      payement: imageUrl,
      killEffectue: false,
    };

    existingData.push(newEntry);
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), "utf8");

    res.status(200).send("Embed envoyé avec succès !");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de l'envoi de l'embed.");
  }
});

app.post("/api/forumulaire_espilon_rp2", async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).send("Aucune donnée reçue.");

    const [date, pseudoClient, nombreDefenseur, fournirStuff, recupStuff] =
      data.split(" | ");

    const configData = getData("data/epsilon/assassinat/config.json");
    const channel = await client.channels.fetch(configData.channelAssassinat2);
    if (!channel || !channel.isTextBased()) {
      return res.status(400).send("Salon introuvable ou non textuel.");
    }

    const embed = new EmbedBuilder()
      .setTitle("📋 Nouvelle demande d'assassinat")
      .setDescription(
        `**Pseudo du Client :** ${pseudoClient}\n` +
          `**Nombre de Defenseur :** ${nombreDefenseur.split(" ")[0]}\n` +
          `**Fournir le Stuff :** ${fournirStuff}\n` +
          `**Récupération du Stuff :** ${recupStuff}\n` +
          `*Prit en charge par personne*`,
      )
      .setColor(config.couleur["epsilon"])
      .setFooter({ text: config.footer });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("assassinat_epsilon_prendre2")
        .setLabel("Prendre en charge l'assassinat")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("assassinat_epsilon_fin2-kill")
        .setLabel("Kill effectué à 100%")
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("assassinat_epsilon_fin2-echouee")
        .setLabel("Mission Echouée")
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),
    );

    const sentMessage = await channel.send({
      embeds: [embed],
      components: [row],
    });

    const filePath = path.join(
      __dirname,
      "data",
      "epsilon",
      "assassinat",
      "donnee2.json",
    );

    let existingData = [];
    if (fs.existsSync(filePath)) {
      existingData = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    const newEntry = {
      messageId: sentMessage.id,
      date,
      pseudoClient,
      nombreDefenseur,
      fournirStuff,
      recupStuff,
      killEffectue: false,
    };

    existingData.push(newEntry);
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), "utf8");

    res.status(200).send("Embed envoyé avec succès !");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de l'envoi de l'embed.");
  }
});

app.post("/api/dossierDisband/:serveur", async (req, res) => {
  try {
    const { serveur } = req.params;
    const data = req.body;

    if (!serveur) {
      return res.status(400).json({ error: "Paramètre 'serveur' manquant" });
    }

    if (!Array.isArray(data)) {
      return res
        .status(400)
        .json({ error: "Les données envoyées doivent être un tableau JSON" });
    }

    const dirPath = path.join(__dirname, "data", serveur);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, "dossierDisband.json");

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

    console.log(`✅ Fichier dossierDisband.json sauvegardé pour ${serveur}`);
    res
      .status(200)
      .json({ success: true, message: `Fichier enregistré pour ${serveur}` });
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde du dossierDisband :", error);
    res.status(500).json({ error: "Erreur interne lors de la sauvegarde" });
  }
});

app.listen(port, () => {
  console.log(
    `Le serveur est en fonctionnement sur http://de3.bot-hosting.net:${port}`,
  );
});
