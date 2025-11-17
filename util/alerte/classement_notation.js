const { getData } = require("../../util/module/getAndSaveData");
const { getEmojiDrapeau } = require("../../util/module/emoji");
const {
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const config = require("../../config");

async function classement_notation(client) {
  const weekRes = await fetch(`${config.glorybot_url}/api/notationWeek`);
  const weekJson = await weekRes.json();
  const week = weekJson.semaine;
  const response = await fetch(
    `https://publicapi.nationsglory.fr/notations?week=${week}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apitoken}`,
        "Content-Type": "application/json",
      },
    },
  );
  const data = await response.json();
  for (const serveur of config.liste_serveur) {
    console.log(
      "🔎 Exécution du classement notations pour le serveur",
      serveur,
    );

    const configuration = getData(`data/${serveur}/config-notation.json`);
    const classementConfig = configuration.classement;

    if (classementConfig?.active && classementConfig.Salon.valeur) {
      const channelId = classementConfig.Salon.valeur;
      const channel = await client.channels.fetch(channelId);

      if (channel) {
        try {
          const topCountries = data
            .slice(0, 3)
            .map(
              (entry, index) =>
                `<:NG${entry.server
                  .charAt(0)
                  .toUpperCase()}${entry.server.slice(1)}:${
                  config.emoji[entry.server]
                }> ${entry.pays.replace(/([a-z])([A-Z])/g, "$1 $2")}・${
                  entry.bourse
                }$`,
            )
            .join("\n");

          const emojis = {};

          const topServerCountriesRaw = data
            .filter((entry) => entry.server === serveur)
            .slice(0, 10);

          for (const entry of topServerCountriesRaw) {
            const pays = entry.pays.toLowerCase();
            try {
              const emoji = await getEmojiDrapeau(client, serveur, pays);

              if (emoji) {
                emojis[pays] = `<:${emoji.name}:${emoji.id}>`;
              } else {
                emojis[pays] = "🏳️";
              }
            } catch (err) {
              console.error(
                `Erreur lors de la récupération de l'emoji pour ${pays}:`,
                err,
              );
              emojis[pays] = "🏳️";
            }
          }

          const topServerCountries = topServerCountriesRaw
            .map((entry) => {
              const paysNom = entry.pays.replace(/([a-z])([A-Z])/g, "$1 $2");
              const emoji = emojis[entry.pays.toLowerCase()] || "🏳️";
              return `${emoji} ${paysNom}・${entry.bourse}$`;
            })
            .join("\n");

          const classementContainer = new ContainerBuilder()
            .setAccentColor(config.couleur[serveur])
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent("## 🏆 Classement des Notations"),
            )
            .addSeparatorComponents((separator) => separator)
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent(
                `**<:NationsGlory:1132392873787129856> Top 3 Inter-Serveur :**\n${topCountries}\n\n**<:NG${serveur
                  .charAt(0)
                  .toUpperCase()}${serveur.slice(1)}:${
                  config.emoji[serveur]
                }> Top 10 ${serveur.charAt(0).toUpperCase()}${serveur.slice(
                  1,
                )} :**\n${topServerCountries}`,
              ),
            )
            .addSeparatorComponents((separator) => separator)
            .addActionRowComponents(
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("notation_help")
                  .setLabel("Informations Supplémentaires")
                  .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                  .setCustomId(`notation_op-${week}`)
                  .setLabel("Qui note mon pays ?")
                  .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                  .setLabel("Page des Notations")
                  .setURL(
                    `https://nationsglory.fr/notations/${serveur}/${week}`,
                  )
                  .setStyle(ButtonStyle.Link),
              ),
            );

          let sentMessage;
          if (classementConfig.Role.valeur) {
            const roleMentions = classementConfig.Role.valeur
              .map((roleId) => `<@&${roleId}>`)
              .join(", ");

            const roleTextDisplay = new TextDisplayBuilder().setContent(
              roleMentions,
            );

            sentMessage = await channel.send({
              components: [roleTextDisplay, classementContainer],
              flags: MessageFlags.IsComponentsV2,
            });
            console.log(
              "✅ Message de classement des notations envoyé pour le serveur",
              serveur,
            );
          } else {
            sentMessage = await channel.send({
              components: [classementContainer],
              flags: MessageFlags.IsComponentsV2,
            });
            console.log(
              "✅ Message de classement des notations envoyé pour le serveur",
              serveur,
            );
          }

          if (channel.type === "GUILD_NEWS") {
            try {
              await sentMessage.crosspost();
              console.log(
                `📣 Message publié dans le salon d’annonce pour ${serveur}`,
              );
            } catch (err) {
              console.warn(
                `⚠️ Impossible de publier le message dans le salon d’annonce : ${err.message}`,
              );
            }
          }
        } catch (err) {
          console.error("Erreur lors de la requête API:", err);
        }
      }
    }
  }
}

module.exports = { classement_notation };
