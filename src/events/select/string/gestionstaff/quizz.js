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
const Configuration = require("../../../../../util/database/models/Configuration");

module.exports = {
  data: {
    name: "gestionstaff_quizz",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);
    const joueur = interaction.customId.split("-")[1];

    const staffData = getData(`data/${serveur}/staff/${joueur}.json`);

    if (!staffData) {
      const container = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((t) => t.setContent("## ❌ Erreur"))
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `Le joueur "**${joueur}**" n'existe pas ou ne fait pas partie du staff du serveur <:NG${serveur
              .charAt(0)
              .toUpperCase()}${serveur.slice(1)}:${config.emoji[serveur]}> **${serveur
              .charAt(0)
              .toUpperCase()}${serveur.slice(1)}**.`,
          ),
        );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    await interaction.deferUpdate({});

    const linkedDiscordIdData = (await discordLink(false)).data;
    const linkedDiscordId = Object.keys(linkedDiscordIdData).find(
      (id) =>
        typeof linkedDiscordIdData[id] === "string" &&
        linkedDiscordIdData[id].toLowerCase() === joueur.toLowerCase(),
    );

    const [configRoutine, configJail] = await Promise.all([
      Configuration.findOne({
        serveur,
        guildId: interaction.guild.id,
        categorie: "Routine",
        systeme: "Routine",
      }),
      Configuration.findOne({
        serveur,
        guildId: interaction.guild.id,
        categorie: "Jail",
        systeme: "Jail",
      }),
    ]);

    const roleAutoriseRoutine = configRoutine.data.get("Grade");
    const roleAutoriseJail = configJail.data.get("Grade");

    const gradesHierarchie = [
      "Administrateur",
      "Super-Modérateur",
      "Modérateur Plus",
      "Modérateur",
      "Modérateur Test",
      "Guide",
    ];

    const utilisateurAutoriseRoutine =
      configRoutine.active &&
      roleAutoriseRoutine &&
      gradesHierarchie
        .slice(0, gradesHierarchie.indexOf(roleAutoriseRoutine) + 1)
        .includes(getData(`data/${serveur}/staff/${joueur}.json`)?.Grade);

    const utilisateurAutoriseJail =
      configJail.active &&
      roleAutoriseJail &&
      gradesHierarchie
        .slice(0, gradesHierarchie.indexOf(roleAutoriseJail) + 1)
        .includes(getData(`data/${serveur}/staff/${joueur}.json`)?.Grade);

    const optionsMenu = [
      {
        label: "Information Générale",
        value: "gestionstaff_information",
        default: false,
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

    if (serveur === "cyan") {
      optionsMenu.push({
        label: "Quizz",
        value: "gestionstaff_quizz",
        default: true,
        emoji: "❓",
      });
    }

    const quizzData = getData(`data/${serveur}/quizz.json`) || [];

    let totalGlobal = 0;
    let goodGlobal = 0;

    const discordId = linkedDiscordId;

    const parQuizz = [];

    for (const semaine of quizzData) {
      let totalSemaine = 0;
      let goodSemaine = 0;

      for (const key of Object.keys(semaine)) {
        if (!key.startsWith("question")) continue;

        const q = semaine[key];
        if (!q?.reponse) continue;

        for (const r of q.reponse) {
          if (r.userId !== discordId) continue;

          totalGlobal++;
          totalSemaine++;

          if (r.bonne_reponse) {
            goodGlobal++;
            goodSemaine++;
          }
        }
      }

      const percentSemaine =
        totalSemaine > 0 ? ((goodSemaine / totalSemaine) * 100).toFixed(1) : 0;

      parQuizz.push({
        id: semaine.semaineId ?? "Inconnu",
        good: goodSemaine,
        total: totalSemaine,
        percent: percentSemaine,
      });
    }

    const percentGlobal =
      totalGlobal > 0 ? ((goodGlobal / totalGlobal) * 100).toFixed(1) : 0;

    const emojiTete = (await getEmojiTete(client, joueur)) || "⏱️";

    const container = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## ${emojiTete} Gestion Staff - ${joueur.replace(/_/g, "\\_")}`,
        ),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `**Résultat global :** ${percentGlobal}% (${goodGlobal}/${totalGlobal})`,
        ),
      )
      .addTextDisplayComponents((t) =>
        t.setContent(
          parQuizz.length
            ? parQuizz
                .map(
                  (q) =>
                    `**Quizz ${q.id} :** ${q.percent}% (${q.good}/${q.total})`,
                )
                .join("\n")
            : "**Aucun quizz trouvé**",
        ),
      )
      .addSeparatorComponents((s) => s);

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
