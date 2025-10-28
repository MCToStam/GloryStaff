const config = require("../../config");
const { getData, saveData } = require("../../util/module/getAndSaveData");
const axios = require("axios");
const { EmbedBuilder } = require("discord.js");

function formatDuree(duree) {
  if (!duree) return "";

  const order = ["y", "mois", "j", "h", "m", "s"];
  const map = {
    y: { sing: "an", plur: "ans" },
    mois: { sing: "mois", plur: "mois" },
    j: { sing: "jour", plur: "jours" },
    h: { sing: "heure", plur: "heures" },
    m: { sing: "minute", plur: "minutes" },
    s: { sing: "seconde", plur: "secondes" },
  };

  const regex = /(\d+)(y|mois|j|h|m|s)/g;
  let matches = [];
  let match;

  while ((match = regex.exec(duree)) !== null) {
    const [, value, unit] = match;
    matches.push({ value: Number(value), unit });
  }

  matches.sort((a, b) => order.indexOf(a.unit) - order.indexOf(b.unit));

  return matches
    .map(({ value, unit }) => {
      const names = map[unit];
      if (!names) return `${value}${unit}`;
      return `${value} ${value > 1 ? names.plur : names.sing}`;
    })
    .join(" ");
}

function parseSanctions(rawText) {
  if (!rawText) return [];

  let clean = rawText.replace(/&[0-9a-frlmonk]/gi, "");
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
  let page = 1;
  let newSanctions = [];

  while (true) {
    const url = `https://apiv2.nationsglory.fr/plugins/api/user/all/${encodeURIComponent(
      pseudonyme,
    )}/get_punisher/${page}`;
    let response;

    try {
      response = await axios.get(url);
    } catch (err) {
      console.error(
        `Erreur API sanctions ${pseudonyme} page ${page}:`,
        err.message,
      );
      break;
    }

    const sanctions = parseSanctions(response.data);
    if (sanctions.length === 0) break;

    for (const sanction of sanctions) {
      if (
        lastKnownSanction &&
        sanction.date === lastKnownSanction.date &&
        sanction.raison === lastKnownSanction.raison &&
        sanction.staff === lastKnownSanction.staff
      ) {
        return newSanctions.reverse();
      }
      newSanctions.push(sanction);
    }

    page++;
    if (page > 10) break;
  }

  return newSanctions.reverse();
}

async function findSanctionServer(pseudonyme, sanction) {
  for (const serveur of config.liste_serveur) {
    let page = 1;
    while (page <= 5) {
      const url = `https://apiv2.nationsglory.fr/plugins/api/user/${serveur}/${encodeURIComponent(
        pseudonyme,
      )}/get_punisher/${page}`;
      try {
        const res = await axios.get(url);
        const sanctions = parseSanctions(res.data);

        for (const s of sanctions) {
          if (
            s.date === sanction.date &&
            s.raison === sanction.raison &&
            s.staff === sanction.staff
          ) {
            return serveur;
          }
        }
      } catch (err) {
        console.error(
          `Erreur API serveur ${serveur} pour ${pseudonyme}:`,
          err.message,
        );
      }
      page++;
    }
  }
  return null;
}

async function sendSanctionMessage(
  channelId,
  roleIds,
  message,
  serveur,
  client,
) {
  const channel = client.channels.cache.get(channelId);
  if (!channel)
    return console.error(
      `Salon ${channelId} sanctions introuvable pour ${serveur}`,
    );

  let content = "";
  if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
    content = roleIds.map((r) => `<@&${r}>`).join(" ");
  }

  const embed = new EmbedBuilder()
    .setTitle(`Nouvelle Sanction`)
    .setDescription(message)
    .setColor(config.couleur[serveur])
    .setTimestamp();

  try {
    await channel.send({ content, embeds: [embed] });
  } catch (err) {
    console.error(`Erreur envoi embed sanctions pour ${serveur}:`, err.message);
  }
}

async function sanction(client, serveur) {
  const configStaff = getData(`data/${serveur}/config-staff.json`);
  const ancienConfigStaff = getData(`data/${serveur}/sanction-config.json`);

  if (
    !configStaff["Sanction Staff"].active ||
    !configStaff["Sanction Staff"].Salon
  )
    return;

  console.log("[SANCTION] Recherche pour le serveur", serveur);

  const staffServer = getData(`data/${serveur}/staff-serveur.json`);

  const filteredStaff = Object.entries(staffServer)
    .filter(([key]) => key !== "timestamp")
    .map(([_, value]) => value);

  const currentStaff = new Set(filteredStaff.flat());

  for (const pseudonyme of currentStaff) {
    if (!pseudonyme) continue;

    let data = getData(`data/${serveur}/staff/${pseudonyme}.json`);

    const lastKnownSanction = data.lastSanction || null;
    const newSanctions = await fetchAllNewSanctions(
      pseudonyme,
      lastKnownSanction,
    );

    if (newSanctions.length === 0) continue;

    for (const sanction of newSanctions) {
      sanction.serveur = await findSanctionServer(pseudonyme, sanction);
    }

    if (!data.lastSanction) {
      data.lastSanction = newSanctions[newSanctions.length - 1];
      saveData(`data/${serveur}/staff/${pseudonyme}.json`, data);
      continue;
    }

    const lignes = newSanctions.map((s) => {
      const ts = s.date
        ? `<t:${Math.floor(new Date(s.date).getTime() / 1000)}:R>`
        : "";

      let dureeStr = "";
      if (s.duree === "Def") {
        if (s.type !== "Warn") {
          dureeStr = "définitif ";
        }
      } else if (s.duree && s.type !== "Warn") {
        dureeStr = `pendant ${formatDuree(s.duree)} `;
      }

      return `${config.emoji_formate[s.serveur] || ""} **${
        s.type
      }** ${dureeStr}pour **${s.raison}** par **${s.staff}** ${ts}`;
    });

    const embedMessage = `**${pseudonyme}** a reçu ${newSanctions.length} ${
      newSanctions.length > 1 ? "nouvelles sanctions" : "nouvelle sanction"
    } :\n\n${lignes.join("\n")}`;

    await sendSanctionMessage(
      configStaff["Sanction Staff"].Salon,
      configStaff["Sanction Staff"].Role,
      embedMessage,
      serveur,
      client,
    );

    data.lastSanction = newSanctions[newSanctions.length - 1];
    saveData(`data/${serveur}/staff/${pseudonyme}.json`, data);
  }

  saveData(`data/${serveur}/sanction-config.json`, ancienConfigStaff);
}

module.exports = { sanction };
