const config = require("../../../config");
const { ActivityType } = require("discord.js");
const log = require("../../../util/module/log");
const getServerPlayer = require("../../../util/module/getServerPlayer");
const { updateLogo } = require("../../../util/updateLogo");
const { botLaunch } = require("../../../main.js");
const { checkEmojiCache } = require("../../../util/module/emoji");
const cron = require("node-cron");

const {
  classement_notation,
} = require("../../../util/alerte/classement_notation");
const {
  disband_14h00,
  disband_17h59,
  disband_18h15,
} = require("../../../util/alerte/disband");
const { guerre } = require("../../../util/alerte/guerre");
const { jail } = require("../../../util/alerte/jail");
const {
  joueurConnecteSalon,
} = require("../../../util/alerte/joueurConnecteSalon");
const { plainte } = require("../../../util/alerte/plainte");
const {
  recapitulatif_hebdomadaire,
} = require("../../../util/alerte/recapitulatif_hebdomadaire");
const {
  recapitulatif_mensuel,
} = require("../../../util/alerte/recapitulatif_mensuel");
const {
  repartition_notation,
} = require("../../../util/alerte/repartition_notation");
const { sanction } = require("../../../util/alerte/sanction");
const { checkCandidature } = require("../../../util/alerte/candidature");
const { checkONU } = require("../../../util/alerte/onu");
const { checkGradeSupport } = require("../../../util/checkGradeSupport");
const { cacheApiGloryBot } = require("../../../util/module/cacheApiGloryBot");

async function cycleStatus(client, index = 0) {
  const server = config.liste_serveur[index];
  const playerCount = await getServerPlayer(server);

  const statusName =
    playerCount !== null
      ? `${
          playerCount.nombre
        } joueurs connectés sur NationsGlory ${server.toUpperCase()}`
      : `NationsGlory ${server.toUpperCase()}`;

  client.user.setPresence({
    activities: [{ name: statusName, type: ActivityType.Watching }],
    status: "online",
  });

  setTimeout(() => {
    const nextIndex = (index + 1) % config.liste_serveur.length;
    cycleStatus(client, nextIndex);
  }, 30 * 1000);
}

module.exports = async (client, interaction) => {
  const botStart = new Date();
  const latence = (botStart.getTime() - botLaunch[0].getTime()) / 1000;

  const guilds = client.guilds.cache.size;
  const usersCount = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);

  log(
    `${client.user.username} est pret en ${latence.toFixed(
      1,
    )}s, sur ${guilds} serveurs et ${usersCount} utilisateurs.`,
    "READY",
    "green",
  );

  await cycleStatus(client);

  cron.schedule(
    "0 10 * * 1",
    async () => {
      await classement_notation(client);
    },
    {
      timezone: "Europe/Paris",
    },
  );

  cron.schedule(
    "0 14 * * 3,6",
    async () => {
      await disband_14h00(client);
    },
    {
      timezone: "Europe/Paris",
    },
  );

  cron.schedule(
    "59 17 * * 3,6",
    async () => {
      await disband_17h59();
    },
    {
      timezone: "Europe/Paris",
    },
  );

  cron.schedule(
    "15 18 * * 3,6",
    async () => {
      await disband_18h15(client);
    },
    {
      timezone: "Europe/Paris",
    },
  );

  cron.schedule(
    "0 0,12 * * *",
    async () => {
      for (const serveur of config.liste_serveur) {
        await sanction(client, serveur);
      }
      await checkGradeSupport(client);
      await cacheApiGloryBot();
    },
    {
      timezone: "Europe/Paris",
    },
  );

  cron.schedule(
    "15 10 * * 1",
    async () => {
      await recapitulatif_hebdomadaire(client);
    },
    {
      timezone: "Europe/Paris",
    },
  );

  cron.schedule(
    "15 10 1 * *",
    async () => {
      await recapitulatif_mensuel(client);
    },
    {
      timezone: "Europe/Paris",
    },
  );

  cron.schedule(
    "0 21 * * 5",
    async () => {
      await repartition_notation(client);
    },
    {
      timezone: "Europe/Paris",
    },
  );

  cron.schedule(
    "*/30 * * * *",
    async () => {
      await plainte(client);
      await guerre(client);
    },
    {
      timezone: "Europe/Paris",
    },
  );

  cron.schedule(
    "*/2 * * * *",
    async () => {
      await jail(client);
      await joueurConnecteSalon(client);
    },
    {
      timezone: "Europe/Paris",
    },
  );

  cron.schedule(
    "*/30 * * * *",
    async () => {
      await checkCandidature(client);
    },
    {
      timezone: "Europe/Paris",
    },
  );

  cron.schedule("0 0 * * *", async () => {
    await updateLogo(client, config);
  });

  cron.schedule("* * * * 0,6", async () => {
    await checkONU(client);
  });

  process.on("unhandledRejection", (reason, p) => {
    console.log(" [antiCrash] :: Unhandled Rejection/Catch");
    console.log(reason, p);
  });
  process.on("uncaughtException", (err, origin) => {
    console.log(" [antiCrash] :: Uncaught Exception/Catch");
    console.log(err, origin);
  });
  process.on("uncaughtExceptionMonitor", (err, origin) => {
    console.log(" [antiCrash] :: Uncaught Exception/Catch (MONITOR)");
    console.log(err, origin);
  });

  await checkEmojiCache(client);
};
