const express = require("express");
const { getData, saveData } = require("./util/module/getAndSaveData");
const { checkGradeSupport } = require("./util/checkGradeSupport");
const { discordStaff, discordLink } = require("./util/module/discordLink");
const { AttenteStaff, DoubleLead } = require("./util/container/module");
const { getEmojiTete } = require("./util/module/emoji");
const log = require("./util/module/log.js");
const bodyParser = require("body-parser");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  WebhookClient,
  MessageFlags,
  TextDisplayBuilder,
  ContainerBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("./config");
const { client } = require("./main");
require("./util/attentestaff");
const util = require("util");
const readFile = util.promisify(fs.readFile);
const Absense = require("./util/database/models/Absence");

async function updateAllStaffWebhooks() {
  for (const serveur of config.liste_serveur) {
    let configWebhook = getData(`data/${serveur}/webhookListeDesStaffs.json`);
    const staffData = getData(`data/${serveur}/staff-serveur.json`);

    const { messageId, webhookUrl } = configWebhook;

    const GRADES = [
      "Administrateur",
      "Super-Modérateur",
      "Modérateur Plus",
      "Modérateur",
      "Modérateur Test",
      "Guide",
    ];

    const GRADES_EMOJI = {
      Administrateur: "<:admin:1289928191674290187>",
      "Super-Modérateur": "<:supermodo:1289928193595281480>",
      "Modérateur Plus": "<:modoplus:1289934725569581086>",
      Modérateur: "<:modo:1289934724294250588>",
      "Modérateur Test": "<:modotest:1289934722151088180>",
      Guide: "<:guide:1289928200800964628>",
    };

    const dataFile = getData(`data/${serveur}/config.json`);
    const configCandidature = dataFile.find((c) => c.nom === "Candidature");

    const escapeUnderscore = (text) => text.replace(/_/g, "\\_");

    const effectifRole = (role) => {
      const members = staffData[role].filter((name) => name.trim() !== "");
      return members.length;
    };

    const now = new Date();
    const absenceData = await Absense.find({
      serveur,
      debut: { $lte: now },
      $or: [{ fin: null }, { fin: { $gt: now } }],
    });

    const absents = new Set(absenceData.map((a) => a.staff));

    const components = [];

    for (const grade of GRADES) {
      const membres = staffData[grade] || [];
      const membresPresents = membres.filter((m) => !absents.has(m));
      const membresAbsents = membres.filter((m) => absents.has(m));

      const membresText =
        membres.length > 0
          ? (
              await Promise.all(
                membres.map(async (m) => {
                  return escapeUnderscore(m);
                }),
              )
            ).join(", ")
          : "Aucun";

      const color = config.grade[grade]
        ? parseInt(config.grade[grade].replace("#", ""), 16)
        : null;

      const nbEffectif = effectifRole(grade);

      let nomGrade = grade + (nbEffectif > 1 ? "s" : "");
      if (grade === "Modérateur Plus" && nbEffectif > 1)
        nomGrade = "Modérateurs Plus";

      const container = new ContainerBuilder()
        .setAccentColor(color)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            `### ${GRADES_EMOJI[grade]} ${nomGrade} (${nbEffectif}) :`,
          ),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(membresText),
        );

      if (membresAbsents.length > 0) {
        const absentsText =
          membresAbsents.length > 0
            ? (
                await Promise.all(
                  membresAbsents.map(async (m) => {
                    return escapeUnderscore(m);
                  }),
                )
              ).join(", ")
            : "Aucun";

        container
          .addSeparatorComponents((separator) => separator)
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(`⏰ Absents : ${absentsText}`),
          );
      }

      if (grade === "Guide") {
        container
          .addSeparatorComponents((separator) => separator)
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setURL(configCandidature.systeme.Guide.lien)
                .setLabel("Recrutement Guide")
                .setStyle(ButtonStyle.Link),
              new ButtonBuilder()
                .setURL(configCandidature.systeme.Modérateur.lien)
                .setLabel("Recrutement Modérateur")
                .setStyle(ButtonStyle.Link),
              new ButtonBuilder()
                .setURL(configCandidature.systeme.Builder.lien)
                .setLabel("Recrutement Builder")
                .setStyle(ButtonStyle.Link),
            ),
          );
      }

      components.push(container);
    }

    if (!webhookUrl) continue;

    const [webhookId, webhookToken] = webhookUrl.split("/").slice(-2);
    const webhookClient = new WebhookClient({
      id: webhookId,
      token: webhookToken,
    });

    try {
      if (messageId) {
        try {
          await webhookClient.editMessage(messageId, {
            embeds: [],
            components,
            flags: MessageFlags.IsComponentsV2,
            withComponents: true,
          });
        } catch (editError) {
          console.warn(
            `Erreur modification message (${serveur}), envoi nouveau...`,
            editError,
          );
          const sent = await webhookClient.send({
            components,
            flags: MessageFlags.IsComponentsV2,
            withComponents: true,
          });
          configWebhook.messageId = sent.id;
        }
      } else {
        const sent = await webhookClient.send({
          components,
          flags: MessageFlags.IsComponentsV2,
          withComponents: true,
        });
        configWebhook.messageId = sent.id;
      }

      saveData(`data/${serveur}/webhookListeDesStaffs.json`, configWebhook);
      log(`✅ Webhhok mis à jour pour le serveur ${serveur}`, "LOG", "gray");
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

app.post("/staff", async (req, res) => {
  res.status(200).json({
    message: "Données reçues et sauvegardées avec succès.",
  });

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
          log(`🗑️ Fichier supprimé : ${file}`, "LOG", "gray");
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
              log(`📕 Fichier créé : ${filePath}`, "LOG", "gray");
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
              log(
                `➕ Ajout du rôle "${role}" à l'historique pour ${staffName} sur le serveur ${serveur} le ${formattedDate}`,
                "LOG",
                "gray",
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

          log(
            `➖ Déclassement de ${staffName} en "Joueur" sur le serveur ${serveur} le ${formattedDate}`,
            "LOG",
            "gray",
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
      log(`✅ Données sauvegardées pour le serveur ${serveur}`, "LOG", "gray");

      const dataFile = getData(`data/${serveur}/config.json`);
      const configStaff = dataFile.find((c) => c.nom === "Staff");
      const configAffichage = configStaff.systeme["Affichage Staff"];

      if (
        !Object.values(configAffichage.active || {}).some(
          (value) => value === true,
        )
      )
        continue;

      const configCandidature = dataFile.find((c) => c.nom === "Candidature");

      const escapeUnderscore = (text) => text.replace(/_/g, "\\_");

      const effectifRole = (role) => {
        const members = processedData[role].filter(
          (name) => name.trim() !== "",
        );
        return members.length;
      };

      const GRADES = [
        "Administrateur",
        "Super-Modérateur",
        "Modérateur Plus",
        "Modérateur",
        "Modérateur Test",
        "Guide",
      ];

      const now = new Date();

      const absenceData = await Absense.find({
        serveur,
        debut: { $lte: now },
        $or: [{ fin: null }, { fin: { $gt: now } }],
      });

      const absents = new Set(absenceData.map((a) => a.staff));

      const components = [];

      for (const grade of GRADES) {
        const membres = processedData[grade] || [];
        const membresPresents = membres.filter((m) => !absents.has(m));
        const membresAbsents = membres.filter((m) => absents.has(m));

        const membresText =
          membres.length > 0
            ? (
                await Promise.all(
                  membresPresents.map(async (m) => {
                    const emoji = (await getEmojiTete(client, m)) || "🧑";
                    return `${emoji} ${escapeUnderscore(m)}`;
                  }),
                )
              ).join(", ")
            : "Aucun";

        const color = config.grade[grade]
          ? parseInt(config.grade[grade].replace("#", ""), 16)
          : null;

        const nbEffectif = effectifRole(grade);

        let nomGrade = grade + (nbEffectif > 1 ? "s" : "");
        if (grade === "Modérateur Plus" && nbEffectif > 1)
          nomGrade = "Modérateurs Plus";

        const container = new ContainerBuilder()
          .setAccentColor(color)
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              `### ${config.emojigrade[grade]} ${nomGrade} (${effectifRole(grade)}) :`,
            ),
          )
          .addSeparatorComponents((separator) => separator)
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(membresText),
          );

        if (membresAbsents.length > 0) {
          const absentsText = (
            await Promise.all(
              membresAbsents.map(async (m) => {
                const emoji = (await getEmojiTete(client, m)) || "🧑";
                return `${emoji} ${escapeUnderscore(m)}`;
              }),
            )
          ).join(", ");

          container
            .addSeparatorComponents((separator) => separator)
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent(`⏰ Absents : ${absentsText}`),
            );
        }

        if (grade === "Guide") {
          container
            .addSeparatorComponents((separator) => separator)
            .addActionRowComponents(
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setURL(configCandidature.systeme.Guide.lien)
                  .setLabel("Recrutement Guide")
                  .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                  .setURL(configCandidature.systeme.Modérateur.lien)
                  .setLabel("Recrutement Modérateur")
                  .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                  .setURL(configCandidature.systeme.Builder.lien)
                  .setLabel("Recrutement Builder")
                  .setStyle(ButtonStyle.Link),
              ),
            );
        }

        components.push(container);
      }

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

        const message = await channel.messages
          .fetch(configAffichage.Message[guildId])
          .catch(() => null);
        if (!message) continue;

        try {
          await message.edit({
            components,
            flags: MessageFlags.IsComponentsV2,
          });

          log(
            `✅ Message effectif staff modifié | serveur ${serveur} | guild ${guildId}`,
            "LOG",
            "gray",
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
    await checkGradeSupport(client);
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
    }
  });
});

app.post("/update-leaders", async (req, res) => {
  res.json({ message: "File updated successfully" });

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
            const serverConfig = configData.systeme["Double Lead"];
            if (!updatedEntry.alerteServeur.find((a) => a.server === server)) {
              eligibleServersMap.set(normalizedServer, serverConfig);
            }
          }

          if (eligibleServersMap.size === 0) continue;

          const leaderPseudos = [...new Set(servers.map((s) => s.compte))];

          for (const [server, serverConfig] of eligibleServersMap.entries()) {
            const container = await DoubleLead(
              client,
              server,
              leaderPseudos,
              servers,
            );

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

              let components = container;
              if (roleMentions.length > 0) {
                components = [
                  new TextDisplayBuilder().setContent(roleMentions),
                  ...container,
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

                log(
                  `✅ Message double lead envoyé | serveur ${server} | guild ${guildId}`,
                  "LOG",
                  "gray",
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
    log(`✅ Temps de jeu ajouté pour le serveur ${serveur}`, "LOG", "gray");
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

    let components = container;
    if (roleMentions.length > 0)
      components = [
        new TextDisplayBuilder().setContent(roleMentions),
        ...container,
      ];

    try {
      const sentMessage = await channel.send({
        components,
        flags: MessageFlags.IsComponentsV2,
      });

      if (channel.type === "GUILD_NEWS") await sentMessage.crosspost();

      log(
        `✅ Message attente staff | serveur ${serveur} | guild ${guildId}`,
        "LOG",
        "gray",
      );
    } catch (err) {
      console.error(
        `❌ Erreur envoi attente staff 18h15 | serveur ${serveur} | guild ${guildId}`,
        err,
      );
    }
  }

  return res.status(200).json({ success: true });
});

app.listen(port, () => {
  console.log(
    `Le serveur est en fonctionnement sur http://de3.bot-hosting.net:${port}`,
  );
});
