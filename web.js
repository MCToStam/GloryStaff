const express = require("express");
const { getData, saveData } = require("./util/module/getAndSaveData");
const { checkGradeSupport } = require("./util/checkGradeSupport");
const { discordStaff, discordLink } = require("./util/module/discordLink");
const { AttenteStaff } = require("./util/container/module");
const { getEmojiTete } = require("./util/module/emoji");
const log = require("./util/module/log");
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
  ChannelType,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("./config");
const { client } = require("./main");
require("./util/attentestaff");
const util = require("util");
const readFile = util.promisify(fs.readFile);
const Absense = require("./util/database/models/Absence");
const CONFIG_STATIC = require("./util/config");
const Configuration = require("./util/database/models/Configuration");
const Serveur = require("./util/database/models/Serveur");

async function updateAllStaffWebhooks() {
  for (const serveur of config.liste_serveur) {
    let configWebhook = getData(`data/${serveur}/webhookListeDesStaffs.json`);
    const staffServeur = await Serveur.findOne({
      serveur,
    }).lean();

    const { messageId, webhookUrl } = configWebhook;

    const GRADES = Object.entries(config.grade)
      .sort(([, a], [, b]) => b.priorite - a.priorite)
      .map(([grade]) => grade);

    const GRADES_EMOJI = {
      administrateur: "<:admin:1289928191674290187>",
      super_moderateur: "<:supermodo:1289928193595281480>",
      modérateur_plus: "<:modoplus:1289934725569581086>",
      moderateur: "<:modo:1289934724294250588>",
      moderateur_test: "<:modotest:1289934722151088180>",
      guide: "<:guide:1289928200800964628>",
    };

    const configCandidature = CONFIG_STATIC.find(
      (c) => c.nom === "Candidature",
    );

    const escapeUnderscore = (text) => text.replace(/_/g, "\\_");

    const now = new Date();
    const absenceData = await Absense.find({
      serveur,
      debut: { $lte: now },
      $or: [{ fin: null }, { fin: { $gt: now } }],
    });

    const absents = new Set(absenceData.map((a) => a.staff));

    const components = [];

    for (const grade of GRADES) {
      const membres = staffServeur.staff[grade] || [];
      const membresPresents = membres.filter((m) => !absents.has(m));
      const membresAbsents = membres.filter((m) => absents.has(m));

      const membresText =
        membresPresents.length > 0
          ? (
              await Promise.all(
                membresPresents.map(async (m) => {
                  return escapeUnderscore(m);
                }),
              )
            ).join(", ")
          : "Aucun";

      const color = config.grade[grade].couleur
        ? parseInt(config.grade[grade].couleur.replace("#", ""), 16)
        : null;

      const nomGrade =
        membres.length > 1
          ? config.grade[grade].nom.pluriel
          : config.grade[grade].nom.normal;

      const container = new ContainerBuilder()
        .setAccentColor(color)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            `### ${GRADES_EMOJI[grade]} ${nomGrade} (${membres.length}) :`,
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
            textDisplay.setContent(
              `**⏰ Absent${membresAbsents.length > 1 ? "s" : ""} :** ${absentsText}`,
            ),
          );
      }

      if (grade === GRADES[GRADES.length - 1]) {
        container
          .addSeparatorComponents((separator) => separator)
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setURL(configCandidature.systeme.Guide.lien[serveur])
                .setLabel("Recrutement Guide")
                .setEmoji(config.grade.guide.emoji)
                .setStyle(ButtonStyle.Link),
              new ButtonBuilder()
                .setURL(configCandidature.systeme.Modérateur.lien[serveur])
                .setLabel("Recrutement Modérateur")
                .setEmoji(config.grade.moderateur.emoji)
                .setStyle(ButtonStyle.Link),
              new ButtonBuilder()
                .setURL(configCandidature.systeme.Builder.lien[serveur])
                .setLabel("Recrutement Builder")
                .setEmoji("1458468397963808872")
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

      log(`✅ Données sauvegardées pour le serveur ${serveur}`, "LOG", "gray");

      const configAffichage = await Configuration.find({
        serveur,
        categorie: "Staff",
        systeme: "Affichage Staff",
      });

      const configCandidature = CONFIG_STATIC.find(
        (c) => c.nom === "Candidature",
      );

      const escapeUnderscore = (text) => text.replace(/_/g, "\\_");

      const GRADES = Object.entries(config.grade)
        .sort(([, a], [, b]) => b.priorite - a.priorite)
        .map(([grade]) => grade);

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

        const color = config.grade[grade].couleur
          ? parseInt(config.grade[grade].couleur.replace("#", ""), 16)
          : null;

        const nomGrade =
          membres.length > 1
            ? config.grade[grade].nom.pluriel
            : config.grade[grade].nom.normal;

        const container = new ContainerBuilder()
          .setAccentColor(color)
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              `### <:${grade}:${config.grade[grade].emoji}> ${nomGrade} (${membres.length}) :`,
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
              textDisplay.setContent(
                `**⏰ Absent${membresAbsents.length > 1 ? "s" : ""} :** ${absentsText}`,
              ),
            );
        }

        if (grade === GRADES[GRADES.length - 1]) {
          container
            .addSeparatorComponents((separator) => separator)
            .addActionRowComponents(
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setURL(configCandidature.systeme.Guide.lien[serveur])
                  .setLabel("Recrutement Guide")
                  .setEmoji(config.grade.guide.emoji)
                  .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                  .setURL(configCandidature.systeme.Modérateur.lien[serveur])
                  .setLabel("Recrutement Modérateur")
                  .setEmoji(config.grade.moderateur.emoji)
                  .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                  .setURL(configCandidature.systeme.Builder.lien[serveur])
                  .setLabel("Recrutement Builder")
                  .setEmoji("1458468397963808872")
                  .setStyle(ButtonStyle.Link),
              ),
            );
        }

        components.push(container);
      }

      for (const configuration of configAffichage) {
        if (!configuration.active) continue;

        const guildId = configuration.guildId;
        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;

        const channelId = configuration.data.get("Salon");
        if (!channelId) continue;

        const channel = guild.channels.cache.get(channelId);
        if (!channel) continue;

        const message = await channel.messages
          .fetch(configuration.data.get("messageId"))
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

          return `${config.serveur[p.serveur].emoji_formate} \`\`${p.staff}\`\` ${
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

app.get("/api/staff", async (req, res) => {
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

  const staffServeur = await Serveur.findOne({
    serveur: serveurLower,
  }).lean();

  try {
    const jsonData = JSON.parse(staffServeur.staff);
    res.json(jsonData);
  } catch (parseErr) {
    res
      .status(500)
      .json({ message: "Erreur de l'API, veuillez contacter ToStam." });
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

  const configAttenteStaff = await Configuration.find({
    serveur,
    categorie: "Attente Staff",
    systeme: "Attente Staff",
  });

  let { components } = await AttenteStaff(client, serveur, joueur, id, salon);

  for (const configuration of configAttenteStaff) {
    if (!configuration.active) continue;

    const guildId = configuration.guildId;
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    const channelId = configuration.data.get("Salon");
    if (!channelId) continue;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) continue;

    const roleIds = configuration.data.get("Role") || [];
    const roleMentions = roleIds.map((id) => `<@&${id}>`).join(" ");

    if (roleMentions.length > 0)
      components = [
        new TextDisplayBuilder().setContent(roleMentions),
        ...components,
      ];

    try {
      const sentMessage = await channel.send({
        components,
        flags: MessageFlags.IsComponentsV2,
      });

      if (channel.type === ChannelType.GuildNews) await sentMessage.crosspost();

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
  log(`Serveur API démarré sur le port ${port}`, "READY", "green");
});
