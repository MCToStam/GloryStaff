const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
  ContainerBuilder,
  ButtonStyle,
} = require("discord.js");
const { getEmojiTete } = require("../../../util/module/emoji");
const { getData } = require("../../../util/module/getAndSaveData");
const {
  discordLink,
  discordStaff,
} = require("../../../util/module/discordLink");
const proxyCommande = require("../../../util/proxy/proxyCommande");

module.exports = {
  config: { permission: "guide" },
  data: new SlashCommandBuilder()
    .setName("staff")
    .setDescription("Affiche la liste des staffs")
    .addStringOption((option) =>
      option
        .setName("staff")
        .setDescription("Le membre du staff à configurer")
        .setRequired(false)
        .setAutocomplete(true),
    ),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur, staff: staffParam } = interaction.parametre;

    const { pseudonym, servers } = await discordStaff(
      interaction.user.id,
      serveur,
      "super_moderateur",
    );

    let staff = staffParam;
    if (servers.length === 0) staff = pseudonym;

    if (!staff) {
      const linkData = (await discordLink(false))?.data;
      const fullStaffData = getData(`data/${serveur}/staff-serveur.json`);

      let fullStaffSection = "";
      for (const [grade, members] of Object.entries(fullStaffData)) {
        if (members.length > 0) {
          const emoji = config.emojigrade[grade] || "";
          const memberNames = members
            .map((name) => {
              const linkedId = Object.keys(linkData).find(
                (id) => linkData[id] === name,
              );
              const escapedName = name.replace(/_/g, "\\_");
              return linkedId
                ? `${escapedName} ( <@${linkedId}> )`
                : escapedName;
            })
            .join(", ");
          fullStaffSection += `**${emoji} ${grade} :** ${memberNames}\n`;
        }
      }
      fullStaffSection =
        fullStaffSection ||
        "Aucune donnée trouvée dans le fichier staff-serveur.json.";

      const container = new ContainerBuilder()
        .setAccentColor(config.couleur[serveur])
        .addTextDisplayComponents((t) =>
          t.setContent(
            `## Liste des Staff - ${
              serveur.charAt(0).toUpperCase() + serveur.slice(1)
            }`,
          ),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) => t.setContent(fullStaffSection))
        .addSeparatorComponents((s) => s)
        .addActionRowComponents((row) =>
          row.setComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`globalstaff`)
              .setPlaceholder("Choisit une option")
              .setOptions([
                {
                  label: "Liste des Staffs",
                  value: "globalstaff_liste",
                  default: true,
                  emoji: "1441495206229835979",
                },
                {
                  label: "Activité en Jeu",
                  value: "globalstaff_activitejeu",
                  default: false,
                  emoji: "1441495207932596234",
                },
                {
                  label: "Activité Vocal sur Discord",
                  value: "globalstaff_activitediscord",
                  default: false,
                  emoji: "1441495208951808203",
                },
                {
                  label: "Traitement des Attentes Staffs",
                  value: "globalstaff_traitement",
                  default: false,
                  emoji: "1441495210206036141",
                },
              ]),
          ),
        );

      if (interaction.isMessageComponent()) {
        return interaction.update({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [] },
        });
      } else {
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [] },
        });
      }
    } else {
      const staffData = getData(`data/${serveur}/staff/${staff}.json`);
      if (!staffData) {
        const container = new ContainerBuilder()
          .setAccentColor(config.colors.error)
          .addTextDisplayComponents((t) => t.setContent("## Erreur"))
          .addSeparatorComponents((s) => s)
          .addTextDisplayComponents((t) =>
            t.setContent(
              `Le joueur "**${staff}**" n'existe pas ou ne fait pas partie du staff du serveur <:NG${serveur
                .charAt(0)
                .toUpperCase()}${serveur.slice(1)}:${
                config.emoji[serveur]
              }> **${serveur.charAt(0).toUpperCase()}${serveur.slice(1)}**.`,
            ),
          );

        if (interaction.isMessageComponent()) {
          return interaction.update({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
          });
        } else {
          return interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
          });
        }
      }

      const fullStaffData = getData(`data/${serveur}/staff-serveur.json`);
      const gradeDuJoueur =
        Object.entries(fullStaffData).find(
          ([, members]) => Array.isArray(members) && members.includes(staff),
        )?.[0] || "Inconnu";

      if (interaction.isMessageComponent()) {
        await interaction.deferUpdate();
      } else {
        await interaction.deferReply();
      }

      const linkedDiscordIdData = (await discordLink(false)).data;
      const linkedDiscordId = Object.keys(linkedDiscordIdData).find(
        (id) =>
          typeof linkedDiscordIdData[id] === "string" &&
          linkedDiscordIdData[id].toLowerCase() === staff.toLowerCase(),
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
              `https://publicapi.nationsglory.fr/user/${staff}`,
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
            }/api/get-bedrock?pseudo_ng=${encodeURIComponent(staff)}`,
          );
          if (!res.ok) return null;
          const data = await res.json();
          return data.pseudo_mc || null;
        })(),
        getEmojiTete(client, staff),
      ]);

      const jailData = getData(`data/${serveur}/config-jail.json`);
      const routineData = getData(`data/${serveur}/config-routine.json`);

      const roleAutoriseJail = jailData.jail.Grade.valeur;
      const roleAutoriseRoutine = routineData.routine.Grade.valeur;

      const gradesHierarchie = [
        "Administrateur",
        "Super-Modérateur",
        "Modérateur Plus",
        "Modérateur",
        "Modérateur Test",
        "Guide",
      ];

      const utilisateurAutoriseJail =
        jailData?.jail?.active &&
        roleAutoriseJail &&
        gradesHierarchie
          .slice(0, gradesHierarchie.indexOf(roleAutoriseJail) + 1)
          .includes(gradeDuJoueur);

      const utilisateurAutoriseRoutine =
        routineData?.routine?.active &&
        roleAutoriseRoutine &&
        gradesHierarchie
          .slice(0, gradesHierarchie.indexOf(roleAutoriseRoutine) + 1)
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
            `## ${emojiTete} Gestion Staff - ${staff.replace(/_/g, "\\_")}`,
          ),
        )
        .addSeparatorComponents((s) => s);

      const lastConn = body?.servers?.[serveur]?.last_connection;
      const playtime = body?.servers?.[serveur]?.playtime;

      container.addTextDisplayComponents((t) =>
        t.setContent(
          `**Grade :** ${
            config.emojigrade[gradeDuJoueur] || ""
          } ${gradeDuJoueur}`,
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
              .setCustomId(`gestionstaff_liaisondiscord-${staff}`)
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
                .setCustomId(`gestionstaff_liaisonminecraft-${staff}`)
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
            textDisplay.setContent(
              `**Blâme${blame > 0 ? "s" : ""} :** ${blame}`,
            ),
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(`gestionstaff_blame-${staff}`)
              .setLabel("Afficher ou Modifier les Blâmes")
              .setStyle(ButtonStyle.Primary),
          ),
      );

      container.addSeparatorComponents((s) => s);

      container.addActionRowComponents((row) =>
        row.setComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`gestionstaff-${staff}`)
            .setPlaceholder("Choisit une option")
            .setOptions(optionsMenu),
        ),
      );

      return interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] },
      });
    }
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
