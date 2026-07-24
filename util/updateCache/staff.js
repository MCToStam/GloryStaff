const Absense = require("../../util/database/models/Absence");
const CONFIG_STATIC = require("../../util/config");
const Configuration = require("../../util/database/models/Configuration");
const Serveur = require("../../util/database/models/Serveur");
const config = require("../../config");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  WebhookClient,
  MessageFlags,
  ContainerBuilder,
} = require("discord.js");
const { discordLink } = require("../../util/module/discordLink");
const { getEmojiTete } = require("../../util/module/emoji");
const log = require("../../util/module/log");
const fs = require("node:fs");
const path = require("node:path");
const { getData, saveData } = require("../../util/module/getAndSaveData");

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
      moderateur_plus: "<:modoplus:1289934725569581086>",
      moderateur: "<:modo:1289934724294250588>",
      moderateur_test: "<:modotest:1289934722151088180>",
      guide: "<:guide:1289928200800964628>",
    };

    const configCandidature = CONFIG_STATIC.find(
      (c) => c.nom === "Candidature",
    );

    const escapeUnderscore = (text) =>
      text.replace(/\\/g, "\\\\").replace(/_/g, "\\_");

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
    } catch (err) {
      console.error(`❌ ${serveur} : erreur d’envoi du webhook :`, err);
    }
  }
}

async function updateStaff(client) {
  const promotions = [];
  for (const serveur of config.liste_serveur) {
    const serverDataGlobal = await Serveur.findOne({ serveur }).lean();
    const serverData = serverDataGlobal.staff;

    const processedData = {
      Administrateur: serverData.administrateur,
      "Super-Modérateur": serverData.super_moderateur,
      "Modérateur Plus": serverData.moderateur_plus,
      Modérateur: serverData.moderateur,
      "Modérateur Test": serverData.moderateur_test,
      Guide: serverData.guide,
    };

    const allStaffList = Object.values(processedData).flat().filter(Boolean);

    const staffDirectoryPath = path.join(
      __dirname,
      "..",
      "..",
      "data",
      "staff",
    );
    if (!fs.existsSync(staffDirectoryPath)) {
      fs.mkdirSync(staffDirectoryPath, { recursive: true });
    }

    const staffServerDir = path.join(
      __dirname,
      "..",
      "..",
      "data",
      serveur,
      "staff",
    );
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
            "..",
            "..",
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

    const configAffichage = await Configuration.find({
      serveur,
      categorie: "Staff",
      systeme: "Affichage Staff",
    });

    const configCandidature = CONFIG_STATIC.find(
      (c) => c.nom === "Candidature",
    );

    const escapeUnderscore = (text) =>
      text.replace(/\\/g, "\\\\").replace(/_/g, "\\_");

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
      const membres = serverData[grade] || [];
      const membresPresents = membres.filter((m) => !absents.has(m));
      const membresAbsents = membres.filter((m) => absents.has(m));

      const membresText =
        membres.length > 0
          ? (
              await Promise.all(
                membresPresents.map(async (m) => {
                  const emoji =
                    (await getEmojiTete(client, m)) ||
                    "<:tete_default:1517896405841215619>";
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
              const emoji =
                (await getEmojiTete(client, m)) ||
                "<:tete_default:1517896405841215619>";
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
}

module.exports = { updateAllStaffWebhooks, updateStaff };
