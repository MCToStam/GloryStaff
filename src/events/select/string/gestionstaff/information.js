const {
  StringSelectMenuBuilder,
  MessageFlags,
  ContainerBuilder,
  ButtonStyle,
} = require("discord.js");
const { getEmojiTete } = require("../../../../../util/module/emoji");
const { getData } = require("../../../../../util/module/getAndSaveData");
const { discordLink } = require("../../../../../util/module/discordLink");
const { getServeur } = require("../../../../../util/module/getServeur");

module.exports = {
  data: {
    name: "gestionstaff_information",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);
    const joueur = interaction.customId.split("-")[1];

    const staffData = getData(`data/${serveur}/staff/${joueur}.json`);

    if (!staffData) {
      const container = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((t) => t.setContent("## Erreur"))
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `Le joueur "**${joueur}**" n'existe pas ou ne fait pas partie du staff du serveur <:NG${serveur
              .charAt(0)
              .toUpperCase()}${serveur.slice(1)}:${
              config.emoji[serveur]
            }> **${serveur.charAt(0).toUpperCase()}${serveur.slice(1)}**.`,
          ),
        );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    await interaction.deferUpdate({});

    const fullStaffData = getData(`data/${serveur}/staff-serveur.json`);
    const gradeDuJoueur =
      Object.entries(fullStaffData).find(
        ([, members]) => Array.isArray(members) && members.includes(joueur),
      )?.[0] || "Inconnu";

    const linkedDiscordIdData = (await discordLink(false)).data;
    const linkedDiscordId = Object.keys(linkedDiscordIdData).find(
      (id) =>
        typeof linkedDiscordIdData[id] === "string" &&
        linkedDiscordIdData[id].toLowerCase() === joueur.toLowerCase(),
    );

    const blameLevels = ["Blâme 1", "Blâme 2", "Blâme 3"];
    let blame = 0;

    for (let i = 0; i < blameLevels.length; i++) {
      if (
        staffData[blameLevels[i]] !== undefined &&
        staffData[blameLevels[i]] !== null &&
        staffData[blameLevels[i]] !== false
      ) {
        blame += 1;
      }
    }

    const formatServeur = serveur.charAt(0).toUpperCase() + serveur.slice(1);

    let [body, linkedMinecraftPseudonym, emojiTete] = await Promise.all([
      (async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const res = await fetch(
            `https://publicapi.nationsglory.fr/user/${joueur}`,
            {
              headers: {
                Authorization: `Bearer ${config.apitoken_backup}`,
                Accept: "application/json",
              },
              signal: controller.signal,
            },
          );
          clearTimeout(timeout);
          return await res.json();
        } catch (error) {
          if (error.name !== "AbortError")
            console.error("Erreur API NG :", error.message);
          return null;
        }
      })(),
      (async () => {
        if (!config.liste_serveur_bedrock.includes(serveur)) return null;
        const res = await fetch(
          `${
            config.glorybot_url
          }/api/get-bedrock?pseudo_ng=${encodeURIComponent(joueur)}`,
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.pseudo_mc || null;
      })(),
      getEmojiTete(client, joueur) || "🧑",
    ]);

    const dataFile = getData(`data/${serveur}/config.json`);
    const configGlobalRoutine = dataFile.find((c) => c.nom === "Routine");
    const configGlobalJail = dataFile.find((c) => c.nom === "Jail");
    const configRoutine = configGlobalRoutine.systeme.Routine;
    const configJail = configGlobalJail.systeme.Jail;

    const guildId = interaction.guild.id;

    const roleAutoriseRoutine = configRoutine.Grade.valeur[guildId];
    const roleAutoriseJail = configJail.Grade.valeur[guildId];

    const gradesHierarchie = [
      "Administrateur",
      "Super-Modérateur",
      "Modérateur Plus",
      "Modérateur",
      "Modérateur Test",
      "Guide",
    ];

    const utilisateurAutoriseRoutine =
      configRoutine.active[guildId] &&
      roleAutoriseRoutine &&
      gradesHierarchie
        .slice(0, gradesHierarchie.indexOf(roleAutoriseRoutine) + 1)
        .includes(gradeDuJoueur);

    const utilisateurAutoriseJail =
      configJail.active[guildId] &&
      roleAutoriseJail &&
      gradesHierarchie
        .slice(0, gradesHierarchie.indexOf(roleAutoriseJail) + 1)
        .includes(gradeDuJoueur);

    const optionsMenu = [
      {
        label: "Information Générale",
        value: "gestionstaff_information",
        default: true,
        emoji: "1441495206229835979",
      },
      {
        label: "Activité en Jeu",
        value: "gestionstaff_activitejeu",
        default: false,
        emoji: "1441495207932596234",
      },
      {
        label: "Activité Vocal sur Discord",
        value: "gestionstaff_activitediscord",
        default: false,
        emoji: "1441495208951808203",
      },
      {
        label: "Traitement des Attentes Staffs",
        value: "gestionstaff_traitement",
        default: false,
        emoji: "1441495210206036141",
      },
    ];

    if (utilisateurAutoriseJail) {
      optionsMenu.push({
        label: "Jail",
        value: "gestionstaff_jail",
        default: false,
        emoji: "1441734907260043264",
      });
    }

    if (utilisateurAutoriseRoutine) {
      optionsMenu.push({
        label: "Routine",
        value: "gestionstaff_routine",
        default: false,
        emoji: "1441734905980649695",
      });
    }

    const container = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## ${emojiTete} Gestion Staff - ${joueur.replace(/_/g, "\\_")}`,
        ),
      )
      .addSeparatorComponents((s) => s);

    const lastConn = body?.servers?.[serveur]?.last_connection;
    const playtime = body?.servers?.[serveur]?.playtime;

    container.addTextDisplayComponents((t) =>
      t.setContent(
        `**Grade :** ${config.emojigrade[gradeDuJoueur] || ""} ${gradeDuJoueur}`,
      ),
    );

    if (lastConn) {
      container.addTextDisplayComponents((t) => {
        const lastConnFormatted = lastConn
          ? `<t:${Math.floor(
              new Date(
                new Date(lastConn + " GMT+0200").toISOString(),
              ).getTime() / 1000,
            )}:R>`
          : null;
        const playtimeFormatted = playtime ? convertirTemps(playtime) : null;

        let content = "";

        if (lastConn) {
          content += `\n**Dernière Connexion ${formatServeur} :** ${lastConnFormatted}\n`;
          content += `**Temps de Jeu ${formatServeur} :** ${playtimeFormatted}\n`;
          content += `**Temps de Jeu Total :** ${totalTemps(body)}`;
        }

        return t.setContent(content);
      });
    }

    container.addSeparatorComponents((s) => s);

    container.addSectionComponents((section) =>
      section
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            `**Liaison Discord :** ${
              linkedDiscordId ? `<@${linkedDiscordId}>` : "Aucune liaison"
            }`,
          ),
        )
        .setButtonAccessory((button) =>
          button
            .setCustomId(`gestionstaff_liaisondiscord-${joueur}`)
            .setLabel(
              linkedDiscordId ? "Modifier la Liaison" : "Ajouter une Liaison",
            )
            .setStyle(ButtonStyle.Primary),
        ),
    );

    if (config.liste_serveur_bedrock.includes(serveur)) {
      container.addSectionComponents((section) =>
        section
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              `**Liaison Minecraft :** ${
                linkedMinecraftPseudonym ?? "Aucune liaison"
              }`,
            ),
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(`gestionstaff_liaisonminecraft-${joueur}`)
              .setLabel(
                linkedMinecraftPseudonym
                  ? "Modifier la Liaison"
                  : "Ajouter une Liaison",
              )
              .setStyle(ButtonStyle.Primary),
          ),
      );
    }

    container.addSectionComponents((section) =>
      section
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(`**Blâme${blame > 0 ? "s" : ""} :** ${blame}`),
        )
        .setButtonAccessory((button) =>
          button
            .setCustomId(`gestionstaff_blame-${joueur}`)
            .setLabel("Afficher ou Modifier les Blâmes")
            .setStyle(ButtonStyle.Primary),
        ),
    );

    container.addSeparatorComponents((s) => s);

    container.addActionRowComponents((row) =>
      row.setComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`gestionstaff-${joueur}`)
          .setPlaceholder("Choisit une option")
          .setOptions(optionsMenu),
      ),
    );

    return interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  },
};

function convertirTemps(secondes) {
  const jours = Math.floor(secondes / (3600 * 24));
  const heures = Math.floor((secondes % (3600 * 24)) / 3600);
  const minutes = Math.floor((secondes % 3600) / 60);

  let temps = "";

  if (jours > 0) {
    temps += jours + " jour" + (jours > 1 ? "s" : "") + ", ";
  }

  if (heures > 0) {
    temps += heures + " heure" + (heures > 1 ? "s" : "") + " et ";
  }

  temps += minutes + " minute" + (minutes > 1 ? "s" : "");

  return temps;
}

function totalTemps(body) {
  let total = 0;
  for (let server in body.servers) {
    if (body.servers[server].playtime) {
      total = total + body.servers[server].playtime;
    }
  }

  return convertirTemps(total);
}
