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

const staffCache = new Map();
const linkCache = new Map();

async function loadCaches() {
  const links = await Link.find().lean();

  for (const l of links) {
    if (!l.discordId || !l.pseudoNg?.length) continue;
    linkCache.set(l.discordId, l.pseudoNg[0]);
  }

  const staffData = await Serveur.find().lean();

  for (const srv of staffData) {
    staffCache.set(srv.serveur, buildStaffIndex(srv.staff));
  }
}

function buildStaffIndex(staff) {
  const index = {};

  for (const [grade, list] of Object.entries(staff)) {
    if (!list) continue;

    for (const name of list) {
      index[name] = grade;
    }
  }

  return index;
}

async function discordLink(discordId) {
  if (!discordId) {
    return {
      data: Object.fromEntries(linkCache),
    };
  }

  return linkCache.get(discordId) || null;
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

  const GRADES_HIERARCHIE = Object.entries(config.grade)
    .sort(([, a], [, b]) => b.priorite - a.priorite)
    .map(([grade]) => grade);

  const minIndex = GRADES_HIERARCHIE.indexOf(gradeMin);

  const userServers = [];

  for (const srv of targetServers) {
    const index = staffCache.get(srv);
    if (!index) continue;

    const userGrade = index[pseudonym];
    if (!userGrade) continue;

    if (GRADES_HIERARCHIE.indexOf(userGrade) <= minIndex) {
      userServers.push(srv);
    }
  }

  return {
    pseudonym,
    servers: userServers,
    container:
      userServers.length === 0
        ? buildErrorContainer(
            config,
            "❌ Permission Manquante",
            `Tu n'as pas la permission d'effectuer cette action ${
              serveur !== "all"
                ? `pour le serveur ${config.serveur[serveur].emoji_formate} **${config.serveur[serveur].nom}** !`
                : "!"
            }`,
          )
        : false,
  };
}

async function errorStaffContainer(serveur) {
  if (serveur === "non-lie") {
    return buildErrorContainer(
      config,
      "❌ Permission Manquante",
      `Tu n'as pas la permission d'effectuer cette action ${
        serveur !== "all"
          ? `pour le serveur ${config.serveur[serveur].emoji_formate} **${config.serveur[serveur].nom}** !`
          : "!"
      }`,
    );
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

module.exports = { discordLink, discordStaff, errorStaffContainer, loadCaches };
