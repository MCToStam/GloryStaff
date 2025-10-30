const config = require("../../config");
const {
  ContainerBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

async function discordLink(discordId = null) {
  try {
    let url = `${config.glorybot_url}/api/get-ng`;
    if (discordId !== null) {
      url += `?discordId=${encodeURIComponent(discordId)}`;
    }

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();

    return discordId !== null ? data.pseudo || null : data;
  } catch (e) {
    return null;
  }
}

async function discordStaff(discordId, serveur = "all") {
  const pseudonym = await discordLink(discordId);
  if (!pseudonym) return { pseudonym: null, servers: [], container: false };

  const serveurs =
    serveur === "all"
      ? config.liste_serveur
      : Array.isArray(serveur)
        ? serveur
        : [serveur];

  if (config.developpeur.includes(discordId)) {
    return { pseudonym, servers: serveurs, container: false };
  }

  const servers = [];
  let container;

  await Promise.all(
    serveurs.map(async (srv) => {
      try {
        const response = await fetch(
          `${config.glorybot_url}/api/serveur?serveur=${srv}`,
          {
            headers: {
              Authorization: `Bearer ${config.glorybot_token}`,
            },
          },
        );

        if (!response.ok) throw new Error(`Erreur serveur ${srv}`);

        const data = await response.json();

        const isAdmin =
          data.staff?.administrateur?.includes(pseudonym) ?? false;
        const isSuperMod =
          data.staff?.super_moderateur?.includes(pseudonym) ?? false;

        if (isAdmin || isSuperMod) {
          servers.push(srv);
        }
      } catch (err) {
        console.error(`Erreur sur le serveur ${srv}:`, err);
      }
    }),
  );

  if (servers.length === 0 && typeof serveur === String) {
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
              ? `pour le serveur <:NG${capitalizedServeur}:${emojiId}> **${capitalizedServeur}** `
              : "!"
          }`,
        ),
      );
  }

  return { pseudonym, servers, container: container || false };
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
    return { errorContainer };
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

    return { errorContainer };
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

    return { errorContainer };
  }

  return { errorContainer: false };
}

module.exports = { discordLink, discordStaff, errorStaffContainer };
