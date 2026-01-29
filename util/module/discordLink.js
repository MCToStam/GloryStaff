const config = require("../../config");
const {
  ContainerBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const { getData } = require("../../util/module/getAndSaveData");

async function discordLink(discordId) {
  try {
    const url = discordId
      ? `${config.glorybot_url}/api/get-ng?discordId=${encodeURIComponent(
          discordId,
        )}`
      : `${config.glorybot_url}/api/get-ng`;

    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      return discordId ? (data.pseudo ?? null) : data;
    } else {
      console.warn("⚠️ API get-ng indisponible, utilisation du fichier local.");
    }
  } catch (err) {}

  try {
    const localData = getData("data/api_get_ng.json") ?? {};
    return discordId ? (localData.data[discordId] ?? null) : localData;
  } catch (err) {
    console.error(
      "❌ Erreur lors de la lecture du fichier api_get_ng.json :",
      err,
    );
    return discordId ? null : {};
  }
}

async function discordStaff(discordId, serveur = "all", gradeMin) {
  const pseudonym = await discordLink(discordId);
  if (!pseudonym) {
    const linkContainer = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## ❌ Compte non Lié"),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          "Ton compte Discord doit être lié à ton compte NationsGlory pour effectuer cette action.",
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("🔗 Lier son Compte")
            .setURL("https://glorybot.fr/user/profile")
            .setStyle(ButtonStyle.Link),
        ),
      );

    return { pseudonym: null, servers: [], container: linkContainer };
  }

  if (config.developpeur.includes(discordId)) {
    return {
      pseudonym,
      servers:
        serveur === "all"
          ? config.liste_serveur
          : Array.isArray(serveur)
            ? serveur
            : [serveur],
      container: false,
    };
  }

  let allStaff = null;
  try {
    const response = await fetch(`${config.glorybot_url}/api/allStaff`, {
      headers: { Authorization: `Bearer ${config.glorybot_token}` },
    });
    if (!response.ok) throw new Error("API non fonctionnelle");
    allStaff = await response.json();
  } catch {
    allStaff = getData("data/api_api_all_staff.json");
  }

  const gradesHierarchie = [
    "administrateur",
    "super_moderateur",
    "moderateur_plus",
    "moderateur",
    "moderateur_test",
    "guide",
  ];

  const pseudoLower = pseudonym.toLowerCase();
  const minIndex = gradesHierarchie.indexOf(gradeMin);
  const targetServers =
    serveur === "all"
      ? config.liste_serveur
      : Array.isArray(serveur)
        ? serveur
        : [serveur];

  const userServers = [];

  for (const srvData of allStaff) {
    if (!targetServers.includes(srvData.serveur)) continue;

    let userGrade = null;

    for (const grade of gradesHierarchie) {
      const staffList = srvData[grade];
      if (
        Array.isArray(staffList) &&
        staffList.map((m) => m.toLowerCase()).includes(pseudoLower)
      ) {
        userGrade = grade;
        break;
      }
    }

    if (!userGrade) continue;

    if (gradesHierarchie.indexOf(userGrade) <= minIndex) {
      userServers.push(srvData.serveur);
    }
  }

  let container = false;
  if (userServers.length === 0 && typeof serveur === "string") {
    const capitalizedServeur =
      serveur.charAt(0).toUpperCase() + serveur.slice(1);
    const emojiId = config.emoji[serveur.toLowerCase()];

    container = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## ❌ Permission Manquante"),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `Tu n'as pas la permission d'effectuer cette action ${
            serveur !== "all"
              ? `pour le serveur <:NG${capitalizedServeur}:${emojiId}> **${capitalizedServeur}** !`
              : "!"
          }`,
        ),
      );
  } else if (userServers.length === 0 && !serveur) {
    container = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## ❌ Permission Manquante"),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          "Tu n'es opérateur d'aucun serveur de NationsGlory, tu n'as donc pas accès à cette commande.",
        ),
      );
  }

  return { pseudonym, servers: userServers, container };
}

async function errorStaffContainer(serveur) {
  if (serveur === "non-lie") {
    const errorContainer = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## ❌ Compte non Lié"),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          "Ton compte Discord doit être lié à ton compte NationsGlory pour effectuer cette action.",
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("🔗 Lier son Compte")
            .setURL("https://glorybot.fr/user/profile")
            .setStyle(ButtonStyle.Link),
        ),
      );
    return errorContainer;
  }

  if (serveur !== "all" && !config.liste_serveur.includes(serveur)) {
    const errorContainer = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## ❌ Serveur Invalide"),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `Le serveur **${serveur}** n'est pas un serveur reconnu. Veuillez fournir un serveur valide.`,
        ),
      );

    return errorContainer;
  }

  const capitalizedServeur = serveur.charAt(0).toUpperCase() + serveur.slice(1);
  const emojiId = config.emoji[serveur.toLowerCase()];

  if (serveur === "permission") {
    const errorContainer = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## ❌ Permission Manquante"),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `Tu n'as pas la permission d'effectuer cette action pour le serveur <:NG${capitalizedServeur}:${emojiId}> **${capitalizedServeur}** !`,
        ),
      );

    return errorContainer;
  }

  return false;
}

module.exports = { discordLink, discordStaff, errorStaffContainer };
