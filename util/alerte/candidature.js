const cheerio = require("cheerio");
const { getEmojiTete } = require("../../util/module/emoji");
const { getData, saveData } = require("../../util/module/getAndSaveData");
const config = require("../../config");
const { MessageFlags, ButtonStyle } = require("discord.js");
const CONFIG_STATIC = require("../../util/config");
const Configuration = require("../../util/database/models/Configuration");

const MOIS_FR = {
  janvier: 0,
  fevrier: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  aout: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  decembre: 11,
};

const ROLES = ["Guide", "Modérateur", "Builder"];
const MAX_CHARS = 4000;

function parseFrenchDate(dateStr) {
  const match = dateStr.match(
    /(\d{1,2}) ([a-zA-ZÀ-ÿ]+) (\d{4}) à (\d{2}):(\d{2})/,
  );
  if (!match) return null;

  const [, jour, mois, annee, heure, minute] = match;
  const monthIndex =
    MOIS_FR[
      mois
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
    ];
  if (monthIndex === undefined) return null;

  return Math.floor(
    new Date(
      Number(annee),
      monthIndex,
      Number(jour),
      Number(heure),
      Number(minute),
    ).getTime() / 1000,
  );
}

function formatPlaytime(totalSeconds) {
  let s = parseInt(totalSeconds, 10);
  const parts = [];

  const units = [
    [365 * 24 * 3600, "an", "ans"],
    [30 * 24 * 3600, "mois", "mois"],
    [24 * 3600, "jour", "jours"],
    [3600, "h", "h"],
    [60, "m", "m"],
    [1, "s", "s"],
  ];

  for (const [secs, singular, plural] of units) {
    const val = Math.floor(s / secs);
    s %= secs;
    if (val) parts.push(`${val} ${val > 1 ? plural : singular}`);
  }

  return parts.length ? parts.join(" ") : "0s";
}

function getCandidatureJsonPath(serveur) {
  return `data/${serveur}/forum/candidature.json`;
}

async function loadSavedData(serveur) {
  try {
    return getData(getCandidatureJsonPath(serveur)) || {};
  } catch {
    return {};
  }
}

async function persistData(serveur, data) {
  await saveData(getCandidatureJsonPath(serveur), data);
}

async function getCandidatureContent(url, serveur) {
  try {
    const threadIdMatch = url.match(/\.([0-9]+)$/);
    const threadId = threadIdMatch?.[1];
    if (!threadId) return "ID du thread introuvable";

    const res = await fetch(url);
    const $ = cheerio.load(await res.text());

    const contentDivs = $(
      `#thread-${threadId} .col-lg-10.py-3 .mb-2.overflow-hidden`,
    );
    if (!contentDivs.length) return "Contenu de la candidature introuvable";

    const components = [];
    let textBuffer = "";
    let totalLength = 0;

    function pushTextBuffer() {
      const trimmed = textBuffer.trim();
      if (!trimmed) return;

      const remaining = MAX_CHARS - totalLength;
      if (remaining <= 0) return;

      const content =
        trimmed.length > remaining
          ? trimmed.slice(0, remaining - 3) + "..."
          : trimmed;

      components.push({ type: 10, content });
      totalLength += content.length;
      textBuffer = "";
    }

    function processNode(node) {
      if (totalLength >= MAX_CHARS) return;

      if (node.type === "text") {
        textBuffer += $(node).text();
      } else if (node.name === "br") {
        textBuffer += "\n";
      } else if (node.name === "img") {
        pushTextBuffer();
        const imgUrl = $(node).attr("data-src") || $(node).attr("src");
        if (imgUrl) {
          components.push({ type: 14, spacing: 1 });
          components.push({ type: 12, items: [{ media: { url: imgUrl } }] });
        }
      } else if (node.children?.length) {
        for (const child of node.children) processNode(child);
      }
    }

    for (const div of contentDivs.toArray()) {
      processNode(div);
      textBuffer += "\n\n";
    }

    pushTextBuffer();

    for (const c of components) {
      if (c.type === 10) {
        c.content = c.content
          .replace(/\u00a0/g, " ")
          .replace(/\s*\n\s*/g, "\n")
          .replace(/\s{2,}/g, " ")
          .replace(/-->\s*\n\s*/g, " --> ");
      }
    }

    return {
      type: 17,
      accent_color: config.serveur[serveur].couleur,
      components,
    };
  } catch (err) {
    console.error("Erreur récupération candidature :", err);
    return "Impossible de récupérer le contenu de la candidature.";
  }
}

async function buildCandidatureContainer(
  client,
  candidature,
  serveur,
  role,
  accentColor,
) {
  const components = [
    {
      type: 10,
      content: `## Candidature ${role} - [${candidature.auteur}](https://nationsglory.fr/profile/${candidature.auteur})`,
    },
    { type: 14, spacing: 1 },
    {
      type: 10,
      content: `${(await getEmojiTete(client, candidature.auteur)) || "<:tete_default:1517896405841215619>"} **Auteur :** ${candidature.auteur}`,
    },
    {
      type: 10,
      content: `🗓️ **Date de création :** <t:${candidature.timestamp}:R>`,
    },
  ];

  try {
    const response = await fetch(
      `https://publicapi.nationsglory.fr/user/${candidature.auteur}`,
      {
        headers: {
          Authorization: `Bearer ${config.apitoken_backup}`,
          accept: "application/json",
        },
      },
    );
    const data = await response.json().catch(() => null);

    if (data?.servers?.[serveur]) {
      const srv = data.servers[serveur];
      const lastConnectionTimestamp = Math.floor(
        new Date(srv.last_connection + "Z").getTime() / 1000,
      );
      const serveurLabel = config.serveur[serveur].nom;

      components.push(
        { type: 14, spacing: 1 },
        {
          type: 10,
          content: `⏱️ **Temps de Jeu ${serveurLabel} :** ${formatPlaytime(srv.playtime)}`,
        },
        {
          type: 10,
          content: `🔙 **Dernière Connexion ${serveurLabel} :** <t:${lastConnectionTimestamp}:R>`,
        },
      );
    }
  } catch {}

  components.push(
    { type: 14, spacing: 1 },
    {
      type: 1,
      components: [
        {
          type: 2,
          custom_id: `candidature_activite-${candidature.auteur}-${serveur}`,
          label: "⌚ Afficher l'Activité",
          style: ButtonStyle.Primary,
        },
      ],
    },
    { type: 14, spacing: 1 },
    {
      type: 1,
      components: [
        {
          type: 2,
          url: candidature.lien,
          label: "🔗 Aller sur la Candidature",
          style: ButtonStyle.Link,
        },
      ],
    },
  );

  return { type: 17, accent_color: accentColor, components };
}

async function sendCandidatures(client, AllCandidatures) {
  const savedDataByServeur = {};

  for (const { serveur, role, candidature } of AllCandidatures) {
    if (serveur !== "white" && role !== "Builder") continue;

    const isNew = candidature.messageId.length === 0;
    const colorChanged = candidature.badgeColor !== candidature.savedBadgeColor;

    if (!isNew && !colorChanged) continue;

    const roleData = await Configuration.find({
      serveur,
      categorie: "Candidature",
      systeme: role,
    });

    const accentColor = candidature.badgeColor
      ? parseInt(candidature.badgeColor.replace("#", ""), 16)
      : 0x6f6f6f;

    try {
      const candidatureContainer = await buildCandidatureContainer(
        client,
        candidature,
        serveur,
        role,
        accentColor,
      );

      if (isNew) {
        const candidatureDetailsContainer = await getCandidatureContent(
          candidature.lien,
          serveur,
        );

        for (const configuration of roleData) {
          if (!configuration.active) continue;

          const channel = getChannel(client, configuration);
          if (!channel) continue;

          const roleIds = configuration.data.get("Role") || [];
          const roleMentions = roleIds.map((id) => `<@&${id}>`).join(" ");
          const headerComponents = roleMentions
            ? [{ type: 10, content: roleMentions }, candidatureContainer]
            : [candidatureContainer];

          const threadName = `Candidature ${role} - ${candidature.auteur}`;

          if (channel.type === 0) {
            const sent = await channel.send({
              components: headerComponents,
              flags: MessageFlags.IsComponentsV2,
            });
            candidature.messageId.push(sent.id);

            const thread = await sent.startThread({ name: threadName });
            await thread.send({
              components: [candidatureDetailsContainer],
              flags: MessageFlags.IsComponentsV2,
            });
          } else if (channel.type === 15) {
            const thread = await channel.threads.create({
              name: threadName,
              message: {
                components: headerComponents,
                flags: MessageFlags.IsComponentsV2,
              },
            });

            await thread.send({
              components: [candidatureDetailsContainer],
              flags: MessageFlags.IsComponentsV2,
            });

            const mainMessage =
              thread.appliedMessage ||
              (await thread.messages
                .fetch({ limit: 1 })
                .then((f) => f.first())
                .catch(() => null));

            if (mainMessage) {
              candidature.messageId.push(mainMessage.id);
            } else {
              console.warn(
                "Impossible de récupérer le message principal du thread forum",
              );
            }
          }
        }

        candidature.savedBadgeColor = candidature.badgeColor;
      } else if (colorChanged) {
        for (const configuration of roleData) {
          if (!configuration.active) continue;

          const channel = getChannel(client, configuration);
          if (!channel) continue;

          const roleIds = configuration.data.get("Role") || [];
          const roleMentions = roleIds.map((id) => `<@&${id}>`).join(" ");
          const headerComponents = roleMentions
            ? [{ type: 10, content: roleMentions }, candidatureContainer]
            : [candidatureContainer];

          for (const msgId of candidature.messageId) {
            const msg = await fetchMessage(channel, msgId);
            if (msg) await msg.edit({ components: headerComponents });
          }
        }

        candidature.savedBadgeColor = candidature.badgeColor;
      }
    } catch (err) {
      console.error(
        `❌ Erreur envoi/édition candidature [${serveur}/${role}/${candidature.auteur}] :`,
        err,
      );
    }

    // Préparer la structure de sauvegarde
    if (!savedDataByServeur[serveur]) savedDataByServeur[serveur] = {};
    if (!savedDataByServeur[serveur][role])
      savedDataByServeur[serveur][role] = [];

    savedDataByServeur[serveur][role].push(serializeCandidature(candidature));
  }

  const serveursTraites = [...new Set(AllCandidatures.map((c) => c.serveur))];

  for (const serveur of serveursTraites) {
    const fileData = {};

    for (const role of ROLES) {
      const candsForRole = AllCandidatures.filter(
        (c) => c.serveur === serveur && c.role === role,
      ).map((c) => serializeCandidature(c.candidature));

      fileData[role] = candsForRole;
    }

    await persistData(serveur, fileData);
  }
}

async function fetchNewCandidatures() {
  const AllCandidatures = [];
  const roleData = CONFIG_STATIC.find((c) => c.nom === "Candidature");

  for (const serveur of config.liste_serveur) {
    const savedData = await loadSavedData(serveur);

    for (const roleName of ROLES) {
      const url = roleData?.systeme?.[roleName]?.lien?.[serveur];
      if (!url) continue;

      try {
        const res = await fetch(url);
        const $ = cheerio.load(await res.text());

        const savedList = savedData[roleName] || [];

        $("tbody tr").each((_, el) => {
          const titre = $(el).find("th a.stretched-link").attr("title") || "";
          const href = $(el).find("th a.stretched-link").attr("href") || "";
          if (!titre || !href) return;

          if ($(el).find("i.mdi.mdi-pin").length) return;

          const metaText = $(el).find("th span.small.text-muted").text().trim();
          const firstBadge = $(el).find("div.mt-1 span.badge").first();
          const badgeColor = firstBadge.length
            ? firstBadge.css("background-color") ||
              firstBadge
                .attr("style")
                ?.match(/background\s*:\s*([^;!]+)/)?.[1] ||
              null
            : null;

          let auteur = "",
            dateStr = "";
          const metaMatch = metaText.match(/^Posté par\s+(\S+)\s+le\s+(.+)$/);
          if (metaMatch) {
            auteur = metaMatch[1];
            dateStr = metaMatch[2];
          }

          const lien = "https://nationsglory.fr" + href;
          const timestamp = parseFrenchDate(dateStr);
          const existing = savedList.find((c) => c.lien === lien);

          const candidatureObj = {
            titre,
            lien,
            auteur,
            timestamp,
            badgeColor,
            messageId: existing?.messageId || [],
            savedBadgeColor: existing?.savedBadgeColor ?? badgeColor ?? null,
          };

          if (existing) {
            existing.badgeColor = badgeColor;
            existing.timestamp = timestamp;
          }

          AllCandidatures.push({
            serveur,
            role: roleName,
            candidature: candidatureObj,
          });
        });
      } catch (err) {
        console.error(`❌ Erreur scraping [${serveur}/${roleName}] :`, err);
      }
    }

    const updatedData = {};
    for (const role of ROLES) {
      updatedData[role] = AllCandidatures.filter(
        (c) => c.serveur === serveur && c.role === role,
      ).map((c) => serializeCandidature(c.candidature));
    }
    await persistData(serveur, updatedData);
  }

  return AllCandidatures;
}

function serializeCandidature(c) {
  return {
    titre: c.titre,
    lien: c.lien,
    auteur: c.auteur,
    timestamp: c.timestamp,
    badgeColor: c.badgeColor,
    savedBadgeColor: c.savedBadgeColor,
    messageId: c.messageId,
  };
}

function getChannel(client, configuration) {
  const guild = client.guilds.cache.get(configuration.guildId);
  if (!guild) return null;
  const channelId = configuration.data.get("Salon");
  if (!channelId) return null;
  return guild.channels.cache.get(channelId) || null;
}

async function fetchMessage(channel, msgId) {
  if (channel.type === 0) {
    return channel.messages.fetch(msgId).catch(() => null);
  } else if (channel.type === 15) {
    const thread = channel.threads.cache.get(msgId);
    if (!thread) return null;
    return (
      thread.appliedMessage ||
      thread.messages
        .fetch({ limit: 1 })
        .then((f) => f.first())
        .catch(() => null)
    );
  }
  return null;
}

async function checkCandidature(client) {
  const AllCandidatures = await fetchNewCandidatures();
  await sendCandidatures(client, AllCandidatures);
}

module.exports = { checkCandidature, fetchNewCandidatures };
