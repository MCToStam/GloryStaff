const log = require("../../util/module/log");
const config = require("../../config");
const { getAbsolutePath } = require("../../util/module/getAndSaveData");
const {
  Alerte,
  Rappel1,
  Rappel2,
  Rappel3,
} = require("../../util/container/module");
const {
  ContainerBuilder,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MediaGalleryBuilder,
  AttachmentBuilder,
  TextDisplayBuilder,
} = require("discord.js");
const CONFIG_STATIC = require("../../util/config");
const Configuration = require("../../util/database/models/Configuration");

const joursMap = {
  Dimanche: 0,
  Lundi: 1,
  Mardi: 2,
  Mercredi: 3,
  Jeudi: 4,
  Vendredi: 5,
  Samedi: 6,
};

function getDateFrance() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }),
  );
}

function parseHeureONU(dateStr) {
  const [jourStr, heureStrPart] = dateStr.split(" ");
  const [heureStr, minuteStr] = heureStrPart.split("h");

  const heure = Number(heureStr);
  const minute = Number(minuteStr);

  return {
    jour: joursMap[jourStr],
    heure,
    minute,
    heureStr: heureStr.padStart(2, "0"),
    minuteStr: minuteStr.padStart(2, "0"),
    jourStr,
  };
}

async function checkONU(client) {
  const now = getDateFrance();

  for (const serveur of config.liste_serveur) {
    const nowKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    const dataONU = CONFIG_STATIC.find((c) => c.nom === "ONU").systeme.Alerte;
    const { jour, heure, minute, heureStr, minuteStr, jourStr } = parseHeureONU(
      dataONU.Heure[serveur],
    );

    const configONU = await Configuration.find({
      serveur,
      categorie: "ONU",
      systeme: "Alerte",
    });

    if (
      now.getDay() === jour &&
      now.getHours() === heure &&
      now.getMinutes() === minute
    ) {
      for (const configuration of configONU) {
        if (!configuration.active) continue;

        const guildId = configuration.guildId;
        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;

        const channelId = configuration.data.get("Salon");
        if (!channelId) continue;

        const channel = guild.channels.cache.get(channelId);
        if (!channel) continue;

        const roleIds = configuration.data.get("Role") || [];
        const roleMentions = roleIds.map((id) => `<@&${id}>`).join(" ");

        let { components, files } = await Alerte(client, serveur);

        if (roleMentions)
          components = [
            new TextDisplayBuilder().setContent(roleMentions),
            ...components,
          ];

        await channel.send({
          components,
          files,
          flags: MessageFlags.IsComponentsV2,
        });

        log(`✅ Message d'ONU envoyé | ${serveur} | ${guildId}`, "LOG", "gray");
      }
    }

    for (let i = 1; i <= 3; i++) {
      const configRappel = await Configuration.find({
        serveur,
        categorie: "ONU",
        systeme: `Rappel ${i}`,
      });

      for (const configuration of configRappel) {
        if (!configuration.active) continue;
        if (!configuration.data.get("Temps")) continue;

        const guildId = configuration.guildId;
        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;

        const channelId = configuration.data.get("Salon");
        if (!channelId) continue;

        const channel = guild.channels.cache.get(channelId);
        if (!channel) continue;

        const roleIds = configuration.data.get("Role") || [];
        const roleMentions = roleIds.map((id) => `<@&${id}>`).join(" ");

        const nowKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
        const rappelDate = new Date(now);
        rappelDate.setHours(heure);
        rappelDate.setMinutes(minute - Number(configuration.data.get("Temps")));
        rappelDate.setSeconds(0);

        if (
          now.getDay() === jour &&
          now.getHours() === rappelDate.getHours() &&
          now.getMinutes() === rappelDate.getMinutes()
        ) {
          const rappels = {
            1: Rappel1,
            2: Rappel2,
            3: Rappel3,
          };

          let { components, files } = await rappels[i](
            client,
            serveur,
            configuration.data.get("Temps"),
          );

          /*if (roleMentions)
            components = [
              new TextDisplayBuilder().setContent(roleMentions),
              ...components,
            ];*/

          await channel.send({
            components,
            files,
            flags: MessageFlags.IsComponentsV2,
          });

          log(
            `✅ Message de rappel ${i} d'ONU envoyé | ${serveur} | ${guildId}`,
            "LOG",
            "gray",
          );
        }
      }
    }
  }
}

module.exports = {
  checkONU,
};
