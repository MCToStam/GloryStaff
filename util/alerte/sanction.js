const config = require("../../config");
const { getData, saveData } = require("../../util/module/getAndSaveData");
const { getEmojiTete } = require("../../util/module/emoji");
const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
} = require("discord.js");

function sameSanction(a, b) {
  return (
    a?.date === b?.date && a?.raison === b?.raison && a?.staff === b?.staff
  );
}

function formatDuree(duree) {
  if (!duree) return "";
  return duree.replace(/(\d+)(y|mois|j|h|m|s)/g, (_, value, unit) => {
    const map = {
      y: { sing: "an", plur: "ans" },
      mois: { sing: "mois", plur: "mois" },
      j: { sing: "jour", plur: "jours" },
      h: { sing: "heure", plur: "heures" },
      m: { sing: "minute", plur: "minutes" },
      s: { sing: "seconde", plur: "secondes" },
    };
    const u = map[unit];
    return u ? `${value} ${value > 1 ? u.plur : u.sing}` : `${value}${unit}`;
  });
}

function parseSanctions(rawText) {
  if (!rawText) return [];

  if (/No sanction registered/i.test(rawText)) {
    return "NO_SANCTION";
  }

  const clean = rawText.replace(/&[0-9a-frlmonk]/gi, "");
  const parts = clean
    .split("###")
    .map((p) => p.trim())
    .filter(Boolean);

  return parts
    .filter((p) => p.includes("[Punisher]"))
    .map((line) => {
      const regex =
        /\[Punisher\]\s*\[(.+?) · (.+?)\]\s*'(.+?)'\s*by\s*(.+?)\s*on\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/i;
      const match = line.match(regex);
      if (!match) return { raw: line };
      return {
        type: match[1],
        duree: match[2],
        raison: match[3],
        staff: match[4],
        date: match[5],
        serveur: null,
      };
    });
}

async function fetchAllNewSanctions(pseudonyme, lastKnownSanction) {
  let newSanctions = [];

  for (let page = 1; page <= 10; page++) {
    const url = `https://apiv2.nationsglory.fr/plugins/api/user/all/${encodeURIComponent(
      pseudonyme,
    )}/get_punisher/${page}`;

    try {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const text = await response.text();
      const sanctions = parseSanctions(text);

      if (sanctions === "NO_SANCTION" || sanctions.length === 0) break;

      for (const sanction of sanctions) {
        if (lastKnownSanction && sameSanction(sanction, lastKnownSanction)) {
          return newSanctions.reverse();
        }
        newSanctions.push(sanction);
      }
    } catch (err) {
      console.error(
        `[SANCTION] Erreur API ${pseudonyme} page ${page}:`,
        err.message,
      );
      break;
    }
  }

  return newSanctions.reverse();
}

async function findSanctionServer(pseudonyme, sanction) {
  for (const serveur of config.liste_serveur) {
    for (let page = 1; page <= 5; page++) {
      const url = `https://apiv2.nationsglory.fr/plugins/api/user/${serveur}/${encodeURIComponent(
        pseudonyme,
      )}/get_punisher/${page}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const text = await res.text();
      const sanctions = parseSanctions(text);

      if (sanctions === "NO_SANCTION") break;

      if (
        Array.isArray(sanctions) &&
        sanctions.some((s) => sameSanction(s, sanction))
      ) {
        return serveur;
      }
    }
  }
  return null;
}

async function sendSanctionMessage(
  channelId,
  roleIds,
  message,
  titre,
  serveur,
  client,
) {
  const channel = client.channels.cache.get(channelId);
  if (!channel)
    return console.error(
      `[SANCTION] Salon ${channelId} introuvable pour ${serveur}`,
    );

  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((t) => t.setContent(`## 🔨 ${titre}`))
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) => t.setContent(message));

  let roleTextDisplay;
  if (roleIds) {
    const roleMentions = roleIds.map((roleId) => `<@&${roleId}>`).join(", ");

    roleTextDisplay = new TextDisplayBuilder().setContent(roleMentions);
  }
  let components = [container];
  if (roleIds) components = [roleTextDisplay, container];

  try {
    await channel.send({
      components,
      flags: MessageFlags.IsComponentsV2,
    });
  } catch (err) {
    console.error(`[SANCTION] Erreur envoi embed sur ${serveur}:`, err.message);
  }
}

async function sanction(client, serveur) {
  const configStaff = getData(`data/${serveur}/config-staff.json`);
  const ancienConfigStaff = getData(`data/${serveur}/sanction-config.json`);

  if (
    !configStaff["Sanction Staff"].active ||
    !configStaff["Sanction Staff"].Salon?.valeur
  )
    return;

  console.log(`[SANCTION] Vérification des sanctions sur ${serveur}`);

  const staffServer = getData(`data/${serveur}/staff-serveur.json`);
  const currentStaff = new Set(
    Object.entries(staffServer)
      .filter(([k]) => k !== "timestamp")
      .flatMap(([_, v]) => v),
  );

  for (const pseudonyme of currentStaff) {
    if (!pseudonyme) continue;

    const dataPath = `data/${serveur}/staff/${pseudonyme}.json`;
    let data = getData(dataPath) || {};
    const lastKnownSanction = data.lastSanction || null;

    const newSanctions = await fetchAllNewSanctions(
      pseudonyme,
      lastKnownSanction,
    );
    if (!newSanctions.length) continue;

    if (!lastKnownSanction) {
      data.lastSanction = newSanctions[newSanctions.length - 1];
      saveData(dataPath, data);
      continue;
    }

    await Promise.all(
      newSanctions.map(async (s) => {
        s.serveur = await findSanctionServer(pseudonyme, s);
      }),
    );

    const lignes = await Promise.all(
      newSanctions.map(async (s) => {
        const ts = s.date
          ? `<t:${Math.floor(new Date(s.date).getTime() / 1000)}:R>`
          : "";

        const dureeStr =
          s.type !== "Warn" && s.duree === "Def"
            ? "définitif "
            : s.type !== "Warn" && s.duree
              ? `pendant ${formatDuree(s.duree)} `
              : "";

        const tete = await getEmojiTete(client, s.staff);

        return `${config.emoji_formate[s.serveur] || ""} **${
          s.type
        }** ${dureeStr}pour **${s.raison}** par ${tete} **${s.staff}** ${ts}`;
      }),
    );

    const embedMessage = `**${await getEmojiTete(
      client,
      pseudonyme,
    )} ${pseudonyme}** a reçu ${newSanctions.length} ${
      newSanctions.length > 1 ? "nouvelles sanctions" : "nouvelle sanction"
    } :\n\n${lignes.join("\n")}`;

    const titre =
      newSanctions.length > 1 ? "Nouvelles Sanctions" : "Nouvelle Sanction";

    await sendSanctionMessage(
      configStaff["Sanction Staff"].Salon.valeur,
      configStaff["Sanction Staff"].Role.valeur,
      embedMessage,
      titre,
      serveur,
      client,
    );

    data.lastSanction = newSanctions[newSanctions.length - 1];
    saveData(dataPath, data);
  }

  saveData(`data/${serveur}/sanction-config.json`, ancienConfigStaff);
}

module.exports = { sanction };
