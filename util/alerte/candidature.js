const cheerio = require("cheerio");
const { getEmojiTete } = require("../../util/module/emoji");
const { getData, saveData } = require("../../util/module/getAndSaveData");
const config = require("../../config");
const {
  MessageFlags,
  SeparatorSpacingSize,
  ButtonStyle,
} = require("discord.js");

const moisFR = {
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

function parseFrenchDate(dateStr) {
  const regex = /(\d{1,2}) ([a-zA-ZÀ-ÿ]+) (\d{4}) à (\d{2}):(\d{2})/;
  const match = dateStr.match(regex);
  if (!match) return null;

  const [, jour, mois, annee, heure, minute] = match;
  const monthIndex =
    moisFR[
      mois
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
    ];
  if (monthIndex === undefined) return null;

  const date = new Date(
    Number(annee),
    monthIndex,
    Number(jour),
    Number(heure),
    Number(minute),
  );
  return Math.floor(date.getTime() / 1000);
}

async function getCandidatureContent(url, serveur) {
  try {
    const threadIdMatch = url.match(/\.([0-9]+)$/);
    const threadId = threadIdMatch ? threadIdMatch[1] : null;
    if (!threadId) return "ID du thread introuvable";

    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const contentDivs = $(
      `#thread-${threadId} .col-lg-10.py-3 .mb-2.overflow-hidden`,
    );
    if (!contentDivs.length) return "Contenu de la candidature introuvable";

    const components = [];
    let textBuffer = "";
    let totalLength = 0;
    const MAX_CHARS = 4000;

    function pushTextBuffer() {
      if (!textBuffer.trim()) return;
      const remaining = MAX_CHARS - totalLength;
      if (remaining <= 0) return;

      let textToPush = textBuffer.trim();
      if (textToPush.length > remaining) {
        textToPush = textToPush.slice(0, remaining - 3) + "...";
      }

      components.push({ type: 10, content: textToPush });
      totalLength += textToPush.length;
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
          components.push({
            type: 14,
            spacing: SeparatorSpacingSize.Small,
          });
          components.push({
            type: 12,
            items: [{ media: { url: imgUrl } }],
          });
        }
      } else if (node.children && node.children.length > 0) {
        for (let child of node.children) processNode(child);
      }
    }

    for (const contentDiv of contentDivs.toArray()) {
      processNode(contentDiv);
      textBuffer += "\n\n";
    }

    pushTextBuffer();

    components.forEach((c) => {
      if (c.type === 10) {
        c.content = c.content
          .replace(/\u00a0/g, " ")
          .replace(/\s*\n\s*/g, "\n")
          .replace(/\s{2,}/g, " ")
          .replace(/-->\s*\n\s*/g, " --> ");
      }
    });

    return {
      type: 17,
      accent_color: config.couleur[serveur],
      components,
    };
  } catch (err) {
    console.error("Erreur récupération candidature :", err);
    return "Impossible de récupérer le contenu de la candidature.";
  }
}

async function sendCandidatures(client, AllCandidatures) {
  for (const { serveur, role, candidature } of AllCandidatures) {
    if (
      candidature.messageId.length !== 0 &&
      candidature.badgeColor === candidature.savedBadgeColor
    )
      continue;

    const data = getData(`data/${serveur}/config.json`);
    const configData = data.find((c) => c.nom === "Candidature");
    const roleData = configData.systeme[role];

    if (!Object.values(roleData.active || {}).some((value) => value === true))
      continue;

    if (
      candidature.messageId.length === 0 ||
      (candidature.messageId.length !== 0 &&
        candidature.badgeColor !== candidature.savedBadgeColor)
    ) {
      try {
        const accentColor = candidature.badgeColor
          ? parseInt(candidature.badgeColor.replace("#", ""), 16)
          : 0x6f6f6f;

        const response = await fetch(
          `https://publicapi.nationsglory.fr/user/${candidature.auteur}`,
          {
            headers: {
              Authorization: `Bearer ${config.apitoken_backup}`,
              accept: "application/json",
            },
          },
        );

        let data = null;
        try {
          data = await response.json();
        } catch (err) {
          data = null;
        }

        const components = [
          {
            type: 10,
            content: `## Candidature ${role} - [${candidature.auteur}](https://nationsglory.fr/profile/${candidature.auteur})`,
          },
          { type: 14, spacing: SeparatorSpacingSize.Small },
          {
            type: 10,
            content: `${
              (await getEmojiTete(client, candidature.auteur)) || "🧑"
            } **Auteur :** ${candidature.auteur}`,
          },
          {
            type: 10,
            content: `🗓️ **Date de création :** <t:${candidature.timestamp}:R>`,
          },
        ];

        if (data && data.servers && data.servers[serveur]) {
          const lastConnectionDate = new Date(
            data.servers[serveur].last_connection + "Z",
          );
          const lastConnectionTimestamp = Math.floor(
            lastConnectionDate.getTime() / 1000,
          );

          let seconds = parseInt(data.servers[serveur].playtime, 10);

          const years = Math.floor(seconds / (365 * 24 * 60 * 60));
          seconds %= 365 * 24 * 60 * 60;

          const months = Math.floor(seconds / (30 * 24 * 60 * 60));
          seconds %= 30 * 24 * 60 * 60;

          const days = Math.floor(seconds / (24 * 60 * 60));
          seconds %= 24 * 60 * 60;

          const hours = Math.floor(seconds / 3600);
          seconds %= 3600;

          const minutes = Math.floor(seconds / 60);
          seconds %= 60;

          const parts = [];
          if (years) parts.push(`${years} an${years > 1 ? "s" : ""}`);
          if (months) parts.push(`${months} mois`);
          if (days) parts.push(`${days} jour${days > 1 ? "s" : ""}`);
          if (hours) parts.push(`${hours}h`);
          if (minutes) parts.push(`${minutes}m`);
          if (seconds) parts.push(`${seconds}s`);

          const playtimeFormatted = parts.length ? parts.join(" ") : "0s";

          components.push(
            { type: 14, spacing: SeparatorSpacingSize.Small },
            {
              type: 10,
              content: `⏱️ **Temps de Jeu ${
                serveur.charAt(0).toUpperCase() + serveur.slice(1)
              } :** ${playtimeFormatted}`,
            },
            {
              type: 10,
              content: `🔙 **Dernière Connexion ${
                serveur.charAt(0).toUpperCase() + serveur.slice(1)
              } :** <t:${lastConnectionTimestamp}:R>`,
            },
          );
        }

        components.push(
          { type: 14, spacing: SeparatorSpacingSize.Small },
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
          { type: 14, spacing: SeparatorSpacingSize.Small },
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

        const candidatureContainer = {
          type: 17,
          accent_color: accentColor,
          components: components,
        };

        if (candidature.messageId.length === 0) {
          const candidatureDetailsContainer = await getCandidatureContent(
            candidature.lien,
            serveur,
          );

          const activeData = roleData.active || {};
          const salonsData = roleData.Salon?.valeur || {};
          const rolesData = roleData.Role?.valeur || {};

          for (const [guildId, isActive] of Object.entries(activeData)) {
            if (!isActive) continue;
            if (!salonsData[guildId]) continue;

            const channel = await client.channels
              .fetch(salonsData[guildId])
              .catch(() => null);

            const roleMentionArray = rolesData[guildId] || [];
            const roleMention = roleMentionArray.length
              ? roleMentionArray.map((r) => `<@&${r}>`).join(" ")
              : null;

            const headerComponents = roleMention
              ? [{ type: 10, content: roleMention }, candidatureContainer]
              : [candidatureContainer];

            if (channel.type === 0) {
              const sent = await channel.send({
                components: headerComponents,
                flags: MessageFlags.IsComponentsV2,
              });
              candidature.messageId.push(sent.id);
              candidature.savedBadgeColor = candidature.badgeColor;

              const thread = await sent.startThread({
                name: `Candidature ${role} - ${candidature.auteur}`,
              });

              await thread.send({
                components: [candidatureDetailsContainer],
                flags: MessageFlags.IsComponentsV2,
              });
            } else if (channel.type === 15) {
              const thread = await channel.threads.create({
                name: `Candidature ${role} - ${candidature.auteur}`,
                message: {
                  components: headerComponents,
                  flags: MessageFlags.IsComponentsV2,
                },
              });

              await thread.send({
                components: [candidatureDetailsContainer],
                flags: MessageFlags.IsComponentsV2,
              });

              let mainMessage;
              if (thread.appliedMessage) {
                mainMessage = thread.appliedMessage;
              } else {
                const fetched = await thread.messages.fetch({ limit: 1 });
                mainMessage = fetched.first();
              }

              if (mainMessage) {
                candidature.messageId.push(mainMessage.id);
                candidature.savedBadgeColor = candidature.badgeColor;
              } else {
                console.warn(
                  "Impossible de récupérer le message principal du thread forum",
                );
              }
            }
          }
        }

        if (
          candidature.messageId.length !== 0 &&
          candidature.badgeColor !== candidature.savedBadgeColor
        ) {
          const salonsData = roleData.Salon?.valeur || {};
          for (const [guildId, channelId] of Object.entries(salonsData)) {
            if (!channelId) continue;

            let channel;
            try {
              channel = await client.channels.fetch(channelId);
            } catch {
              continue;
            }
            if (!channel) continue;

            for (const msgId of candidature.messageId) {
              let msg = null;
              if (channel.type === 0) {
                msg = await channel.messages.fetch(msgId).catch(() => null);
              } else if (channel.type === 15) {
                const thread = channel.threads.cache.get(msgId);
                if (thread) {
                  msg =
                    thread.appliedMessage ||
                    (await thread.messages
                      .fetch({ limit: 1 })
                      .then((f) => f.first())
                      .catch(() => null));
                }
              }
              if (msg) await msg.edit({ components: [candidatureContainer] });
            }
          }

          candidature.savedBadgeColor = candidature.badgeColor;
        }
      } catch (err) {
        console.error(`❌ Erreur envoi/édition candidature :`, err);
      }
    }
  }

  const serveurs = [...new Set(AllCandidatures.map((c) => c.serveur))];

  for (const serveur of serveurs) {
    const data = getData(`data/${serveur}/config.json`);
    const configData = data.find((c) => c.nom === "Candidature");
    const roles = ["Guide", "Modérateur", "Builder"];

    for (const role of roles) {
      const roleData = configData.systeme[role];

      const allCandsForRole = AllCandidatures.filter(
        (c) => c.role === role && c.serveur === serveur,
      );

      roleData.save = allCandsForRole.map((c) => ({
        titre: c.candidature.titre,
        lien: c.candidature.lien,
        auteur: c.candidature.auteur,
        timestamp: c.candidature.timestamp,
        badgeColor: c.candidature.badgeColor,
        savedBadgeColor: c.candidature.savedBadgeColor,
        messageId: c.candidature.messageId,
      }));
    }

    saveData(`data/${serveur}/config.json`, data);
  }
}

async function fetchNewCandidatures() {
  let AllCandidatures = [];

  for (const serveur of config.liste_serveur) {
    const data = getData(`data/${serveur}/config.json`);
    const configData = data.find((c) => c.nom === "Candidature");
    const roles = ["Guide", "Modérateur", "Builder"];

    let modified = false;

    for (const roleName of roles) {
      const roleData = configData.systeme[roleName];

      try {
        const response = await fetch(roleData.lien);
        const html = await response.text();
        const $ = cheerio.load(html);

        let candidatures = [];

        $("tbody tr").each((i, el) => {
          const titre = $(el).find("th a.stretched-link").attr("title") || "";
          const lien = $(el).find("th a.stretched-link").attr("href") || "";
          const metaText = $(el).find("th span.small.text-muted").text().trim();
          const firstBadge = $(el).find("div.mt-1 span.badge").first();
          const badgeColor = firstBadge.length
            ? firstBadge.css("background-color") ||
              firstBadge.attr("style")?.match(/background:([^;!]+)/)?.[1]
            : null;

          const isPinned = $(el).find("i.mdi.mdi-pin").length > 0;
          if (isPinned) return;

          let auteur = "";
          let dateStr = "";
          if (metaText.startsWith("Posté par")) {
            const match = metaText.match(/^Posté par\s+(\S+)\s+le\s+(.+)$/);
            if (match) {
              auteur = match[1];
              dateStr = match[2];
            }
          }

          const timestamp = parseFrenchDate(dateStr);

          if (titre) {
            const existing = roleData.save.find(
              (c) => c.lien === "https://nationsglory.fr" + lien,
            );

            const candidatureObj = {
              titre,
              lien: "https://nationsglory.fr" + lien,
              auteur,
              timestamp,
              badgeColor,
              messageId: existing?.messageId || [],
              savedBadgeColor: existing?.savedBadgeColor || badgeColor || null,
            };

            candidatures.push(candidatureObj);

            AllCandidatures.push({
              serveur: serveur,
              role: roleName,
              candidature: candidatureObj,
            });
          }
        });

        if (!roleData.save) roleData.save = [];

        for (const cand of candidatures) {
          const existing = roleData.save.find((c) => c.lien === cand.lien);
          if (existing) {
            existing.badgeColor = cand.badgeColor;
            existing.timestamp = cand.timestamp;
            modified = true;
          } else {
            roleData.save.push(cand);
            modified = true;
          }
        }
      } catch (err) {}
    }

    if (modified) {
      saveData(`data/${serveur}/config.json`, data);
    }
  }

  return AllCandidatures;
}

async function checkCandidature(client) {
  const AllCandidatures = await fetchNewCandidatures();
  await sendCandidatures(client, AllCandidatures);
}

module.exports = { checkCandidature };
