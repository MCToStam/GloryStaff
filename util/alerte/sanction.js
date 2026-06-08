const config = require("../../config");
const log = require("../../util/module/log");
const { getData, saveData } = require("../../util/module/getAndSaveData");
const { SanctionStaff } = require("../../util/container/module");
const { MessageFlags, TextDisplayBuilder, ChannelType } = require("discord.js");

function sameSanction(a, b) {
  return (
    a?.date === b?.date && a?.raison === b?.raison && a?.staff === b?.staff
  );
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
        /\[Punisher\] \[(\w+)\s*·\s*(.*?)\s*\] '(.+?)' by (.+?) on (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/i;
      const match = line.match(regex);
      if (!match) return { raw: line };
      return {
        type: match[1],
        duree: match[2] || "",
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
  active,
  salon,
  role,
  pseudonyme,
  newSanctions,
  serveur,
  client,
) {
  if (!Object.values(active || {}).some((value) => value === true)) return;

  let { components } = await SanctionStaff(
    client,
    serveur,
    pseudonyme,
    newSanctions,
  );

  for (const [guildId, isActive] of Object.entries(active)) {
    if (!isActive) continue;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    const channelId = salon[guildId];
    if (!channelId) continue;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) continue;

    const roleIds = role[guildId] || [];
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
        `✅ Message nouvelle sanction envoyé | serveur ${serveur} | guild ${guildId}`,
        "LOG",
        "gray",
      );
    } catch (err) {
      console.error(
        `❌ Erreur envoi nouvelle sanction | serveur ${serveur} | guild ${guildId}`,
        err,
      );
    }
  }
}

async function sanction(client, serveur) {
  const dataFile = getData(`data/${serveur}/config.json`);
  const configData = dataFile.find((c) => c.nom === "Staff");
  const configSanction = configData.systeme["Sanction Staff"];

  log(
    `🔍 Vérification des sanctions pour le serveur ${serveur}`,
    "LOG",
    "gray",
  );

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

    await sendSanctionMessage(
      configSanction.active,
      configSanction.Salon.valeur,
      configSanction.Role.valeur,
      pseudonyme,
      newSanctions,
      serveur,
      client,
    );

    data.lastSanction = newSanctions[newSanctions.length - 1];
    saveData(dataPath, data);
  }
}

module.exports = { sanction };
