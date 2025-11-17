const { getData } = require("../../util/module/getAndSaveData");
const {
  EmbedBuilder,
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const config = require("../../config");

async function onu(client, server, jour) {
  try {
    const configData = getData(`data/${server}/config-onu.json`);

    const alerteActive = configData.Alerte.active;
    const heureParts = configData.Alerte.Heure.split(" ");

    if (
      alerteActive &&
      heureParts[0] === jour &&
      configData.Alerte.Salon.valeur
    ) {
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

      const [jourOnu, heureOnu] = configData.Alerte["Heure"].split(" ");

      if (heureParts[1] === formattedTime) {
        const imagePath = `./data/${server}/onu.png`;
        const attachment = new AttachmentBuilder(imagePath, {
          name: "onu.png",
        });

        let embed;
        let actionRow;

        if (server.toLowerCase() === "coral") {
          embed = new EmbedBuilder()
            .setColor(config.couleur[server])
            .setTitle("✨  L'ONU CORAL ✨")
            .setDescription(
              "🌍 L’ONU, c’est une réunion entre le staff et les joueurs 🤝\n" +
                "On y parle des 🔔 rappels, des 🆕 nouveautés (interserveur & Coral), des 💣 T4 autonuke, des 🎖️ ranks, " +
                "puis on termine avec une 💬 partie communautaire (questions + pubs). Rendez-vous sur Youtube ou sur Discord.\n\n" +
                "https://www.youtube.com/@NationsGloryCoral/streams\n\n" +
                "__**Oubliez pas les récompenses de VIEWERS :**__\n\n" +
                "➤ 25 viewers = 🎟️ 50k RP\n" +
                "➤ 35 viewers = 🎟️ 100k RP\n" +
                "➤ 40 viewers = 💳 10€ Boutique\n" +
                "➤ 50 viewers = 💳 20€ Boutique",
            )
            .setImage("attachment://onu.png")
            .setFooter({ text: config.footer });

          actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("onu_help")
              .setLabel("Je n'arrive pas à accéder au salon")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setLabel("Regarder le stream YouTube")
              .setStyle(ButtonStyle.Link)
              .setURL("https://www.youtube.com/@NationsGloryCoral/streams"),
          );
        } else {
          embed = new EmbedBuilder()
            .setColor(config.couleur[server])
            .setTitle(
              `🌐 ONU ${server.charAt(0).toUpperCase() + server.slice(1)} 🌐`,
            )
            .setDescription(
              `L’ONU est une réunion hebdomadaire entre le staff et les joueurs ! Ce rendez-vous permet de faire des rappels, annoncer les nouveautés, les rank ainsi que de faire des pubs, des demandes de missiles, d’autonuke et de poser toutes les questions qui vous titillent. Afin de participer à l'ONU, il vous suffit de rejoindre le [Discord Global](https://discord.gg/nationsglory) de NationsGlory et rejoindre le salon ${configData.Alerte["Salon NationsGlory"]}.\n\n` +
                `Voici les différentes règlementations :\n` +
                `- Les assauts sont interdit\n` +
                `- Le PvP est désactivé sauf dans les arènes et les warzones\n` +
                `- Les warzones ne distribuent pas de récompenses\n` +
                `- La présence des chefs est fortement recommandée\n\n` +
                `Cette réunion a lieu le **${jourOnu.toLowerCase()}** à **${heureOnu}**.`,
            )
            .setImage("attachment://onu.png")
            .setFooter({ text: config.footer });

          actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("onu_help")
              .setLabel("Je n'arrive pas à accéder au salon")
              .setStyle(ButtonStyle.Primary),
          );
        }

        const channel = await client.channels.fetch(
          configData.Alerte.Salon.valeur,
        );
        let sentMessage;
        if (configData.Alerte.Role) {
          console.log(
            `Envoie ONU avec Rôle ${server} : ${configData.Alerte.Role.valeur}`,
          );
          sentMessage = await channel.send({
            content: `<@&${configData.Alerte.Role.valeur}>`,
            embeds: [embed],
            files: [attachment],
            components: [actionRow],
          });
        } else {
          console.log(`Envoie ONU sans Rôle ${server}`);
          sentMessage = await channel.send({
            embeds: [embed],
            files: [attachment],
            components: [actionRow],
          });
        }
        console.log(`✅ Message d'ONU du serveur ${server} envoyé avec succès`);
      }
    }
  } catch (error) {
    console.error(
      `Erreur lors de la vérification de l'heure pour le serveur ${server}: ${error.message}`,
    );
  }
}

module.exports = { onu };
