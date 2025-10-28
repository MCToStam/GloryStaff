const { getData } = require("../../util/module/getAndSaveData");
const config = require("../../config");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require("discord.js");

async function rappel_onu(client, server, jour) {
  try {
    const configData = getData(`data/${server}/config-onu.json`);

    for (let i = 1; i <= 3; i++) {
      const rappel = configData[`Rappel ${i}`];

      if (rappel.active && rappel.Salon && rappel.Temps) {
        const currentTime = new Date();
        const timeZone = "Europe/Paris";
        const options = {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        };
        const currentDateTime = new Intl.DateTimeFormat("fr-FR", {
          ...options,
          timeZone,
        }).format(currentTime);
        const [currentHour, currentMinute] = currentDateTime.split(":");
        const formattedTime = `${currentHour}h${currentMinute}`;

        const [jourOnu, heureOnu] = configData.Alerte.Heure.split(" ");
        const [heureONU, minuteONU] = heureOnu.split("h");

        const rappelTime = parseInt(rappel.Temps);
        const heure = parseInt(heureONU);
        const minute = parseInt(minuteONU);

        const rappelDate = new Date(currentTime);
        rappelDate.setHours(heure);
        rappelDate.setMinutes(minute);

        rappelDate.setMinutes(rappelDate.getMinutes() - rappelTime);

        const rappelHeure = rappelDate.getHours().toString().padStart(2, "0");
        const rappelMinute = rappelDate
          .getMinutes()
          .toString()
          .padStart(2, "0");
        const heureRappel = `${rappelHeure}h${rappelMinute}`;

        if (heureRappel === formattedTime && jour === jourOnu) {
          const imagePath = `./data/${server}/rappel_onu.png`;
          const attachment = new AttachmentBuilder(imagePath, {
            name: "rappel.png",
          });

          const embed = {
            color: config.couleur[server],
            title: `📅 Rappel ONU ${
              server.charAt(0).toUpperCase() + server.slice(1)
            }`,
            description: `C'est bientôt l'ONU ! Pour rappel, cette réunion est prévue pour **${jourOnu}** à **${heureOnu}**, donc dans exactement **${rappelTime} ${
              rappelTime > 1 ? "minutes" : "minute"
            }**. Ne manquez pas l'occasion de participer à ce regroupement !`,
            image: { url: `attachment://rappel.png` },
            footer: { text: config.footer },
          };

          const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("onu_help")
              .setLabel("Qu'est ce que l'ONU ?")
              .setStyle(ButtonStyle.Primary),
          );

          const channel = await client.channels.fetch(rappel.Salon);
          let sentMessage;
          if (rappel.Role) {
            sentMessage = await channel.send({
              content: `<@&${rappel.Role}>`,
              embeds: [embed],
              files: [attachment],
              components: [actionRow],
            });
          } else {
            sentMessage = await channel.send({
              embeds: [embed],
              files: [attachment],
              components: [actionRow],
            });
          }
          console.log(
            `✅ Message de rappel ONU ${i} du serveur ${server} envoyé avec succès`,
          );
        }
      }
    }
  } catch (error) {
    console.error(
      `Erreur lors de la vérification des rappels pour le serveur ${server}: ${error.message}`,
    );
  }
}

module.exports = { rappel_onu };
