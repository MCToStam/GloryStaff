const config = require("../../config");
const {
  getData,
  getAbsolutePath,
  saveData,
} = require("../module/getAndSaveData");
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
  const [heureStr, minuteStr] = heureStrPart.split("h").map(Number);
  const [heure, minute] = [heureStr, minuteStr].map(Number);

  return {
    jour: joursMap[jourStr],
    heure,
    minute,
    heureStr,
    minuteStr,
    jourStr,
  };
}

async function checkONU(client) {
  const now = getDateFrance();

  for (const serveur of config.liste_serveur) {
    const data = getData(`data/${serveur}/config-onu.json`);
    if (!data || !data["Alerte"]) continue;

    const nowKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    const alerteONU = data["Alerte"];
    const { jour, heure, minute, heureStr, minuteStr, jourStr } = parseHeureONU(
      alerteONU.Heure,
    );
    if (
      alerteONU.active &&
      now.getDay() === jour &&
      now.getHours() === heure &&
      now.getMinutes() === minute &&
      alerteONU.lastSent !== nowKey
    ) {
      if (!alerteONU.Salon?.valeur) continue;

      const channel = await client.channels
        .fetch(alerteONU.Salon?.valeur)
        .catch(() => null);
      if (!channel) continue;

      const roleTextDisplay = new TextDisplayBuilder();
      if (alerteONU.Role.valeur.length > 0)
        roleTextDisplay.setContent(
          alerteONU.Role.valeur.map((roleId) => `<@&${roleId}>`).join(", "),
        );

      const container = new ContainerBuilder()
        .setAccentColor(config.couleur[serveur])
        .addTextDisplayComponents((t) =>
          t.setContent(
            `## 🌐 ONU ${serveur.charAt(0).toUpperCase() + serveur.slice(1)} 🌐`,
          ),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `L’ONU est une réunion hebdomadaire entre le staff et les joueurs ! Ce rendez-vous permet de faire des rappels, annoncer les nouveautés, les rank ainsi que de faire des pubs, des demandes de missiles, d’autonuke et de poser toutes les questions qui vous titillent. Afin de participer à l'ONU, il vous suffit de rejoindre le [Discord Global](https://discord.gg/nationsglory) de NationsGlory et rejoindre le salon ${
              alerteONU["Salon NationsGlory"]
            }.\n\nVoici les différentes règlementations :\n- Les assauts sont interdit\n- Le PvP est désactivé sauf dans les arènes et les warzones\n- Les warzones ne distribuent pas de récompenses\n- La présence des chefs est fortement recommandée\n\nCette réunion a lieu le **${jourStr.toLowerCase()}** à **${heureStr}h${minuteStr}**.`,
          ),
        )
        .addMediaGalleryComponents(
          new MediaGalleryBuilder().addItems((mediaGalleryItem) =>
            mediaGalleryItem.setURL("attachment://onu.png"),
          ),
        )
        .addSeparatorComponents((s) => s)
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("onu_help")
              .setLabel("Je n'arrive pas à accéder au salon")
              .setStyle(ButtonStyle.Primary),
          ),
        );

      const imagePath = getAbsolutePath(`data/${serveur}/onu.png`);

      const attachment = new AttachmentBuilder(imagePath, {
        name: "onu.png",
      });

      const components =
        alerteONU.Role.valeur.length > 0
          ? [roleTextDisplay, container]
          : [container];

      await channel.send({
        components,
        files: [attachment],
        flags: MessageFlags.IsComponentsV2,
      });
      console.log(
        `✅ Message d'ONU envoyé avec succès pour le serveur ${serveur}`,
      );

      alerteONU.lastSent = nowKey;
      saveData(`data/${serveur}/config-onu.json`, data);
    }

    for (let i = 1; i <= 3; i++) {
      const rappel = data[`Rappel ${i}`];
      if (!rappel?.active || !rappel.Temps) continue;

      const nowKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      const rappelDate = new Date(now);
      rappelDate.setHours(heure);
      rappelDate.setMinutes(minute - Number(rappel.Temps));
      rappelDate.setSeconds(0);

      if (
        now.getDay() === jour &&
        now.getHours() === rappelDate.getHours() &&
        now.getMinutes() === rappelDate.getMinutes() &&
        rappel.lastSent !== nowKey
      ) {
        if (!rappel.Salon?.valeur) continue;

        const channel = await client.channels
          .fetch(rappel.Salon?.valeur)
          .catch(() => null);
        if (!channel) continue;

        const roleTextDisplay = new TextDisplayBuilder();
        if (rappel.Role.valeur.length > 0)
          roleTextDisplay.setContent(
            rappel.Role.valeur.map((roleId) => `<@&${roleId}>`).join(", "),
          );

        const container = new ContainerBuilder()
          .setAccentColor(config.couleur[serveur])
          .addTextDisplayComponents((t) =>
            t.setContent(
              `## 📅 Rappel ONU ${
                serveur.charAt(0).toUpperCase() + serveur.slice(1)
              } 🌐`,
            ),
          )
          .addSeparatorComponents((s) => s)
          .addTextDisplayComponents((t) =>
            t.setContent(
              `C'est bientôt l'ONU ! Pour rappel, cette réunion est prévue pour **${jourStr}** à **${heureStr}h${minuteStr}**, donc dans exactement **${
                rappel.Temps
              } ${
                rappel.Temps > 1 ? "minutes" : "minute"
              }**. Ne manquez pas l'occasion de participer à ce regroupement !`,
            ),
          )
          .addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems((mediaGalleryItem) =>
              mediaGalleryItem.setURL("attachment://rappel_onu.png"),
            ),
          )
          .addSeparatorComponents((s) => s)
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("onu_help")
                .setLabel("Je n'arrive pas à accéder au salon")
                .setStyle(ButtonStyle.Primary),
            ),
          );

        const imagePath = getAbsolutePath(`data/${serveur}/rappel_onu.png`);

        const attachment = new AttachmentBuilder(imagePath, {
          name: "rappel_onu.png",
        });

        const components =
          rappel.Role.valeur.length > 0
            ? [roleTextDisplay, container]
            : [container];

        await channel.send({
          components,
          files: [attachment],
          flags: MessageFlags.IsComponentsV2,
        });
        console.log(
          `✅ Message de rappel d'ONU n°${i} envoyé avec succès pour le serveur ${serveur}`,
        );

        rappel.lastSent = nowKey;
        saveData(`data/${serveur}/config-onu.json`, data);
      }
    }
  }
}

module.exports = {
  checkONU,
};
