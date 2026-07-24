const { Client, Intents } = require("discord.js-selfbot-v13");
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.MESSAGE_CONTENT,
    Intents.FLAGS.GUILD_MEMBERS,
  ],
});
const log = require("../util/module/log");
const config = require("../config");
const {
  getData,
  saveData,
  getFiles,
} = require("../util/module/getAndSaveData");
const { discordLink, discordStaff } = require("../util/module/discordLink");
const sendAttenteStaff = require("../util/alerte/attente_staff");
const Serveur = require("../util/database/models/Serveur");
const ActiviteDiscord = require("../util/database/models/ActiviteDiscord");

const lastNotifications = new Set();

function isMemberVocallyActive(member) {
  return Boolean(
    member?.voice?.channel && !member.voice.selfMute && !member.voice.selfDeaf,
  );
}

async function reconcileSession(serveur, pseudo, member) {
  const active = isMemberVocallyActive(member);

  const activite = await ActiviteDiscord.findOne({ serveur, pseudo });
  const openSessions = activite?.session?.filter((s) => !s.end) || [];

  if (!active) {
    if (openSessions.length === 0) return false;

    const now = new Date();
    for (const session of openSessions) {
      session.end = now;
    }
    if (openSessions.length > 1) {
      console.warn(
        `${openSessions.length} sessions ouvertes simultanément pour ${pseudo}/${serveur}, toutes fermées au démarrage.`,
      );
    }
    await activite.save();
    return true;
  }

  if (openSessions.length > 0) return false;

  await ActiviteDiscord.findOneAndUpdate(
    { pseudo, serveur },
    {
      $push: {
        session: {
          start: new Date(),
          end: null,
        },
      },
    },
    {
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
  return true;
}

async function reconcileServeur(serveur, pseudoToDiscord, guild) {
  const serveurData = await Serveur.findOne({ serveur }).lean();
  if (!serveurData) return;

  const allPseudos = [
    ...new Set(
      Object.values(serveurData.staff || {})
        .flat()
        .filter(Boolean),
    ),
  ];

  let changes = 0;

  for (const pseudo of allPseudos) {
    const discordId = pseudoToDiscord.get(pseudo.toLowerCase());
    const member = discordId ? guild.members.cache.get(discordId) : null;

    try {
      const changed = await reconcileSession(serveur, pseudo, member);
      if (changed) changes++;
    } catch (error) {
      console.error(
        `Erreur de réconciliation de session pour ${pseudo}/${serveur} :`,
        error,
      );
    }
  }

  return changes;
}

client.on("ready", async () => {
  const linkedDiscordIdData = (await discordLink(false)).data;
  const guild = client.guilds.cache.get("427943983000453140");

  if (!guild) return;
  await guild.members.fetch();

  const pseudoToDiscord = new Map();
  for (const [id, pseudo] of Object.entries(linkedDiscordIdData)) {
    if (typeof pseudo === "string") {
      pseudoToDiscord.set(pseudo.toLowerCase(), id);
    }
  }

  const results = await Promise.allSettled(
    config.liste_serveur.map((serveur) =>
      reconcileServeur(serveur, pseudoToDiscord, guild),
    ),
  );

  let totalChanges = 0;
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(
        `Erreur lors de la réconciliation du serveur ${config.liste_serveur[i]} :`,
        result.reason,
      );
    } else if (typeof result.value === "number") {
      totalChanges += result.value;
    }
  });

  log(
    `✅ Vérification des sessions vocales terminée pour tous les serveurs (${totalChanges} session(s) ouverte(s)/fermée(s))`,
    "LOG",
    "gray",
  );
});

function extractServeurFromChannelName(channelName) {
  const match = channelName?.match(/^Traitement (.+) #(\d+)$/);
  return match ? match[1] : null;
}

async function handleVocalSession(state, action) {
  const { pseudonym: pseudo, servers } = await discordStaff(
    state.member.id,
    "all",
    "guide",
  );

  if (!pseudo || !servers?.length) return;

  for (const serveur of servers) {
    if (action === "start") {
      const activite = await ActiviteDiscord.findOne({
        pseudo,
        serveur,
      });

      const sessionOuverte = activite?.session?.some((session) => !session.end);

      if (sessionOuverte) {
        continue;
      }

      await ActiviteDiscord.findOneAndUpdate(
        {
          pseudo,
          serveur,
        },
        {
          $push: {
            session: {
              start: new Date(),
              end: null,
            },
          },
        },
        {
          upsert: true,
          setDefaultsOnInsert: true,
        },
      );
    } else if (action === "end") {
      await ActiviteDiscord.updateOne(
        {
          pseudo,
          serveur,
          "session.end": null,
        },
        {
          $set: {
            "session.$.end": new Date(),
          },
        },
      );
    }
  }
}

async function handleAttenteStaffJoin(oldState, newState, member) {
  if (
    !newState.channelId ||
    (oldState.channelId && oldState.channelId === newState.channelId)
  ) {
    return;
  }

  const [channelName, data] =
    Object.entries(config.serveur).find(
      ([, serveurData]) => serveurData.attenteStaff === newState.channelId,
    ) || [];

  const channelId = data?.attenteStaff;
  if (!channelName) return;

  const key = `${member.id}:${channelId}`;
  if (lastNotifications.has(key)) return;

  lastNotifications.add(key);
  sendAttenteStaff(channelName, member.displayName, member.id);
  setTimeout(() => lastNotifications.delete(key), 60000);

  if (newState.guild.id !== "427943983000453140") return;

  const serveur = extractServeurFromChannelName(newState.channel?.name);
  if (!serveur) return;

  try {
    const pseudo = await discordLink(member.id);
    if (!pseudo) return;

    const path = `data/${serveur.toLowerCase()}/staff/${pseudo}.json`;
    const dataFile = getData(path);
    if (!dataFile) return;

    if (!dataFile.traitement_attentestaff) {
      dataFile.traitement_attentestaff = [];
    }
    dataFile.traitement_attentestaff.push({
      start: Date.now(),
      end: false,
    });
    saveData(path, dataFile);
  } catch (error) {
    console.error(
      `Erreur lors du join (traitement) pour ${member.displayName} :`,
      error,
    );
  }
}

async function handleAttenteStaffLeave(oldState, newState, member) {
  if (
    !oldState.channelId ||
    (newState.channelId && newState.channelId === oldState.channelId)
  ) {
    return;
  }

  if (oldState.guild.id !== "427943983000453140") return;

  const serveur = extractServeurFromChannelName(oldState.channel?.name);
  if (!serveur) return;

  try {
    const pseudo = await discordLink(member.id);
    if (!pseudo) return;

    const path = `data/${serveur.toLowerCase()}/staff/${pseudo}.json`;
    const dataFile = getData(path);
    if (!dataFile) return;

    if (!dataFile.traitement_attentestaff) {
      dataFile.traitement_attentestaff = [];
    }

    const openEntries = dataFile.traitement_attentestaff.filter(
      (e) => e.end === false,
    );

    if (openEntries.length > 0) {
      const now = Date.now();
      for (const entry of openEntries) {
        entry.end = now;
      }
      saveData(path, dataFile);
    }
  } catch (error) {
    console.error(
      `Erreur lors du leave (traitement) pour ${member.displayName} :`,
      error,
    );
  }
}

async function handleVocalActivity(oldState, newState) {
  const wasActive =
    oldState.channelId && !oldState.selfMute && !oldState.selfDeaf;
  const isActive =
    newState.channelId && !newState.selfMute && !newState.selfDeaf;

  if (!wasActive && isActive) {
    await handleVocalSession(newState, "start");
  } else if (wasActive && !isActive) {
    await handleVocalSession(oldState, "end");
  } else if (
    wasActive &&
    isActive &&
    newState.channelId !== oldState.channelId
  ) {
    await handleVocalSession(oldState, "end");
    await handleVocalSession(newState, "start");
  }
}

client.on("voiceStateUpdate", async (oldState, newState) => {
  const member = newState.member || oldState.member;
  if (!member) return;

  await handleAttenteStaffJoin(oldState, newState, member);
  await handleAttenteStaffLeave(oldState, newState, member);
  await handleVocalActivity(oldState, newState);
});

client
  .login(process.env.DISCORD_SELFBOT_TOKEN)
  .catch((err) => console.error("Erreur de connexion :", err));

process.on("SIGINT", () => {
  client.destroy();
  process.exit();
});
