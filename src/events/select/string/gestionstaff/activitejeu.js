const {
  StringSelectMenuBuilder,
  MessageFlags,
  ContainerBuilder,
  ButtonStyle,
  AttachmentBuilder,
  MediaGalleryBuilder,
  ButtonBuilder,
} = require("discord.js");
const { getEmojiTete } = require("../../../../../util/module/emoji");
const { getData } = require("../../../../../util/module/getAndSaveData");
const { getServeur } = require("../../../../../util/module/getServeur");
const { generateConnexionGraph } = require("../../../../../util/connexion");
const Configuration = require("../../../../../util/database/models/Configuration");

module.exports = {
  data: {
    name: "gestionstaff_activitejeu",
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

    const errorContainer = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((t) =>
        t.setContent(`## ❌ Compte Minecraft non Lié`),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `Le compte NationsGlory "${joueur.replace(/_/g, "\\_")}" n'est relié a aucun compte Minecraft, son temps de jeu ne peut donc pas être enregistré sur les serveur Bedrock.`,
        ),
      );

    if (config.liste_serveur_bedrock.includes(serveur)) {
      const res = await fetch(
        `${
          config.glorybot_url
        }/api/get-bedrock?pseudo_ng=${encodeURIComponent(joueur)}`,
      );
      if (!res.ok) return null;
      const data = await res.json();
      const pseudoMinecraft = data.pseudo_mc || null;
      if (!pseudoMinecraft) {
        return interaction.reply({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        });
      }
    }

    await interaction.deferUpdate({});

    const tempsJeu = staffData["temps-de-jeu"] || {};
    let semaineOffset = 0;
    const today = new Date();
    if (today.getDay() === 1) {
      semaineOffset = -1;
    }

    const now = new Date();
    const jours = [
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
      "Dimanche",
    ];

    now.setDate(now.getDate() + semaineOffset * 7);

    const base = new Date(today);
    const currentDay = base.getDay();
    const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
    base.setDate(base.getDate() + diffToMonday);
    base.setDate(base.getDate() + semaineOffset * 7);

    const monday = new Date(today);
    const currentDay2 = monday.getDay();
    const diffToMonday2 = (currentDay2 === 0 ? -6 : 1) - currentDay2;
    monday.setDate(monday.getDate() + diffToMonday2 + semaineOffset * 7);

    const mondayFormatted = monday.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    let description = "";

    const labels = [];
    const values = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + diffToMonday + i);

      const day = ("0" + date.getDate()).slice(-2);
      const month = ("0" + (date.getMonth() + 1)).slice(-2);
      const year = date.getFullYear();
      const dateString = `${day}-${month}-${year}`;

      labels.push(jours[i]);
      values.push(tempsJeu[dateString] || 0);

      const tempsSec = tempsJeu[dateString] || 0;
      const temps = formatDuration(tempsSec);

      description += `**${jours[i]} ${day} ${moisEnTexte(
        month,
      )} :** ${temps}\n`;
    }

    const total = values.reduce((acc, val) => acc + val, 0);
    const moyenne = values.length > 0 ? total / values.length : 0;
    description += `\n**Moyenne de connexion cette semaine :** ${formatDuration(
      Math.floor(moyenne),
    )}`;

    const buffer = await generateConnexionGraph(
      serveur,
      tempsJeu,
      semaineOffset,
      true,
    );

    const fullStaffData = getData(`data/${serveur}/staff-serveur.json`);
    const gradeDuJoueur =
      Object.entries(fullStaffData).find(
        ([, members]) => Array.isArray(members) && members.includes(joueur),
      )?.[0] || "Inconnu";

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
        .includes(gradeDuJoueur);

    const utilisateurAutoriseJail =
      configJail.active &&
      roleAutoriseJail &&
      gradesHierarchie
        .slice(0, gradesHierarchie.indexOf(roleAutoriseJail) + 1)
        .includes(gradeDuJoueur);

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
        default: true,
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
        default: false,
        emoji: "❓",
      });
    }

    const attachment = new AttachmentBuilder(buffer, {
      name: "gestionstaff_activitejeu.png",
    });

    const emojiTete = (await getEmojiTete(client, joueur)) || "🧑";

    const container = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## ${emojiTete} Gestion Staff - ${joueur.replace(/_/g, "\\_")}`,
        ),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) => t.setContent(description))
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems((mediaGalleryItem) =>
          mediaGalleryItem.setURL("attachment://gestionstaff_activitejeu.png"),
        ),
      )
      .addActionRowComponents((row) =>
        row.setComponents(
          new ButtonBuilder()
            .setCustomId(
              `gestionstaff_activitejeu-/${joueur}/${semaineOffset - 1}`,
            )
            .setLabel("⬅️ Semaine précédente")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`gestionstaff_activitejeu_status`)
            .setLabel(`Semaine du ${mondayFormatted}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(
              `gestionstaff_activitejeu-/${joueur}/${semaineOffset + 1}`,
            )
            .setLabel("Semaine suivante ➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(semaineOffset >= 0),
        ),
      )
      .addSeparatorComponents((s) => s)
      .addActionRowComponents((row) =>
        row.setComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`gestionstaff-${joueur}`)
            .setPlaceholder("Choisit une option")
            .setOptions(optionsMenu),
        ),
      );

    return interaction.editReply({
      files: [attachment],
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  },
};

function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  let result = "";

  if (h > 0) result += `${h} heure${h > 1 ? "s" : ""} `;
  if (m > 0) result += `${m} minute${m > 1 ? "s" : ""}  `;
  if (s > 0 || result === "") result += `${s} seconde${s > 1 ? "s" : ""} `;

  return result.trim();
}

function moisEnTexte(num) {
  const noms = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  return noms[parseInt(num, 10) - 1];
}
