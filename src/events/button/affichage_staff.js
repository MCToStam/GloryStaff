const { ContainerBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { getData, saveData } = require("../../../util/module/getAndSaveData");
const { getServeur } = require("../../../util/module/getServeur");

module.exports = {
  data: {
    name: "affichage_staff",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);
    const configGlobale = getData(`data/${serveur}/config.json`);
    const configStaff = configGlobale.find((c) => c.nom === "Staff");
    const configAffiche = configStaff.systeme["Affichage Staff"];
    const guildId = interaction.guild.id;

    if (
      !configAffiche.active[guildId] ||
      !configAffiche.Salon.valeur[guildId]
    ) {
      const container = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(`## ❌ Configuration Manquante`),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            "Le système est désactivé ou aucun salon n'a été configuré.",
          ),
        );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const staffServeur = getData(`data/${serveur}/staff-serveur.json`);

    const escapeUnderscore = (text) => text.replace(/_/g, "\\_");

    const effectifRole = (role) => {
      const members = staffServeur[role].filter((name) => name.trim() !== "");
      return members.length;
    };

    const description = `
                                    **${
                                      config.emojigrade["Administrateur"]
                                    } Administrateurs (${effectifRole(
                                      "Administrateur",
                                    )}) :**\n${
                                      staffServeur["Administrateur"].join(
                                        ", ",
                                      ) || "Aucun"
                                    }
                                    \n**${
                                      config.emojigrade["Super-Modérateur"]
                                    } Super Modérateurs (${effectifRole(
                                      "Super-Modérateur",
                                    )}) :**\n${escapeUnderscore(
                                      staffServeur["Super-Modérateur"].join(
                                        ", ",
                                      ) || "Aucun",
                                    )}
                                    \n**${
                                      config.emojigrade["Modérateur Plus"]
                                    } Modérateurs Plus (${effectifRole(
                                      "Modérateur Plus",
                                    )}) :**\n${escapeUnderscore(
                                      staffServeur["Modérateur Plus"].join(
                                        ", ",
                                      ) || "Aucun",
                                    )}
                                    \n**${
                                      config.emojigrade["Modérateur"]
                                    } Modérateurs (${effectifRole(
                                      "Modérateur",
                                    )}) :**\n${escapeUnderscore(
                                      staffServeur["Modérateur"].join(", ") ||
                                        "Aucun",
                                    )}
                                    \n**${
                                      config.emojigrade["Modérateur Test"]
                                    } Modérateurs Tests (${effectifRole(
                                      "Modérateur Test",
                                    )}) :**\n${escapeUnderscore(
                                      staffServeur["Modérateur Test"].join(
                                        ", ",
                                      ) || "Aucun",
                                    )}
                                    \n**${
                                      config.emojigrade["Guide"]
                                    } Guides (${effectifRole(
                                      "Guide",
                                    )}) :**\n${escapeUnderscore(
                                      staffServeur["Guide"].join(", ") ||
                                        "Aucun",
                                    )}
                                    \n\n*Dernière mise à jour : <t:${staffServeur.timestamp}:R>*
                                `;

    const staffEmbed = new EmbedBuilder()
      .setAuthor({
        name: `Staff du serveur ${
          serveur.charAt(0).toUpperCase() + serveur.slice(1)
        }`,
        url: `https://nationsglory.fr/server/${serveur}/staff`,
      })
      .setThumbnail(`${config.glorybot_url}/api/banniere?serveur=${serveur}`)
      .setColor(config.couleur[serveur])
      .setDescription(description)
      .setFooter({ text: config.footer });

    const channel = await client.channels.fetch(
      configAffiche.Salon.valeur[guildId],
    );

    const message = await channel.send({
      embeds: [staffEmbed],
      flags: MessageFlags.Ephemeral,
    });

    configAffiche.Message[guildId] = message.id;

    saveData(`data/${serveur}/config.json`, configGlobale);

    const messageLink = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;

    const container = new ContainerBuilder()
      .setAccentColor(config.colors.success)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(`## ✅ Message Envoyé`),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `Le message d'effectif a correctement été envoyé ici : ${messageLink}`,
        ),
      );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
