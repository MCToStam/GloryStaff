const config = require("../../config");
const {
  ContainerBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const Serveur = require("../../util/database/models/Serveur");
const Link = require("../../util/database/models/Link");
const {
  buildErrorContainer,
  buildLinkRequiredContainer,
} = require("../proxy/reply");

async function discordLink(discordId) {
  if (discordId) {
    const link = await Link.findOne({ discordId }).lean();
    return link?.pseudoNg?.length ? link.pseudoNg[0] : null;
  }

  const links = await Link.find({}).lean();
  if (!links.length) return null;

  return {
    data: Object.fromEntries(
      links
        .filter((l) => l.pseudoNg?.length)
        .map((l) => [l.discordId, l.pseudoNg[0]]),
    ),
  };
}

async function discordStaff(discordId, serveur = "all", gradeMin) {
  const pseudonym = await discordLink(discordId);

  if (!pseudonym) {
    return {
      pseudonym: null,
      servers: [],
      container: buildLinkRequiredContainer(),
    };
  }

  const targetServers =
    serveur === "all"
      ? config.liste_serveur
      : Array.isArray(serveur)
        ? serveur
        : [serveur];

  if (config.developpeur.includes(discordId)) {
    return { pseudonym, servers: targetServers, container: false };
  }

  const staffData = await Serveur.find({ serveur: targetServers }).lean();

  const GRADES_HIERARCHIE = Object.entries(config.grade)
    .sort(([, a], [, b]) => a.priorite - b.priorite)
    .map(([grade]) => grade);
  const pseudoLower = pseudonym.toLowerCase();
  const minIndex = GRADES_HIERARCHIE.indexOf(gradeMin);

  const userServers = [];

  for (const srvData of staffData) {
    let userGrade = null;

    for (const grade of GRADES_HIERARCHIE) {
      const staffList = srvData.staff[grade];
      if (staffList?.some((m) => m.toLowerCase() === pseudoLower)) {
        userGrade = grade;
        break;
      }
    }

    if (!userGrade) continue;

    if (GRADES_HIERARCHIE.indexOf(userGrade) <= minIndex) {
      userServers.push(srvData.serveur);
    }
  }

  let container = false;

  if (userServers.length === 0) {
    if (typeof serveur === "string") {
      container = buildErrorContainer(
        config,
        "❌ Permission Manquante",
        `Tu n'as pas la permission d'effectuer cette action ${
          serveur !== "all"
            ? `pour le serveur ${config.serveur[serveur].emoji_formate} **${config.serveur[serveur].nom}** !`
            : "!"
        }`,
      );
    } else if (!serveur) {
      container = buildErrorContainer(
        config,
        "❌ Permission Manquante",
        "Tu n'es opérateur d'aucun serveur de NationsGlory, tu n'as donc pas accès à cette commande.",
      );
    }
  }

  return { pseudonym, servers: userServers, container };
}

async function errorStaffContainer(serveur) {
  if (serveur === "non-lie") {
    return buildLinkRequiredContainer();
  }

  if (serveur === "permission") {
    return buildErrorContainer(
      config,
      "❌ Permission Manquante",
      `Tu n'as pas la permission d'effectuer cette action pour le serveur ${config.serveur[serveur]?.emoji_formate} **${config.serveur[serveur]?.nom}** !`,
    );
  }

  if (serveur !== "all" && !config.liste_serveur.includes(serveur)) {
    return buildErrorContainer(
      config,
      "❌ Serveur Invalide",
      `Le serveur **${serveur}** n'est pas un serveur reconnu. Veuillez fournir un serveur valide.`,
    );
  }

  return false;
}

module.exports = { discordLink, discordStaff, errorStaffContainer };
