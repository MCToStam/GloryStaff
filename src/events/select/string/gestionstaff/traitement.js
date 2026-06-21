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
const Serveur = require("../../../../../util/database/models/Serveur");

module.exports = {
  data: {
    name: "gestionstaff_traitement",
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
            `Le joueur "**${joueur}**" n'existe pas ou ne fait pas partie du staff du serveur ${config.serveur[serveur].emoji_formate} **${config.serveur[serveur].nom}**.`,
          ),
        );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    await interaction.deferUpdate({});

    const sessions = staffData["traitement_attentestaff"] || [];
    const traitementCount = {};

    sessions.forEach(({ start }) => {
      const startDate = new Date(start);

      const day = ("0" + startDate.getDate()).slice(-2);
      const month = ("0" + (startDate.getMonth() + 1)).slice(-2);
      const year = startDate.getFullYear();
      const dateString = `${day}-${month}-${year}`;

      if (!traitementCount[dateString]) traitementCount[dateString] = 0;
      traitementCount[dateString]++;
    });

    const traitementDuration = {};

    sessions.forEach(({ start, end }) => {
      if (!end) return;

      const startDate = new Date(start);
      const endDate = new Date(end);
      const durationMs = endDate - startDate;

      const day = ("0" + startDate.getDate()).slice(-2);
      const month = ("0" + (startDate.getMonth() + 1)).slice(-2);
      const year = startDate.getFullYear();
      const dateString = `${day}-${month}-${year}`;

      if (!traitementDuration[dateString]) traitementDuration[dateString] = 0;
      traitementDuration[dateString] += durationMs;
    });

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
      values.push(traitementCount[dateString] || 0);
      const traitementsDay = traitementCount[dateString] || 0;
      const durationDay = traitementDuration[dateString] || 0;

      description += `**${jours[i]} ${day} ${moisEnTexte(
        month,
      )} :** ${traitementsDay} traitement${traitementsDay > 1 ? "s" : ""}`;

      if (traitementsDay > 0 && durationDay > 0) {
        description += ` (Durée Totale : ${formatDuration(durationDay)})`;
      }

      description += `\n`;
    }

    const total = values.reduce((acc, val) => acc + val, 0);
    description += `\n**Total de traitements cette semaine :** ${total}`;

    const buffer = await generateConnexionGraph(
      serveur,
      traitementCount,
      semaineOffset,
      false,
    );

    const staffServeur = await Serveur.findOne({
      serveur,
    }).lean();

    const gradeDuJoueur =
      Object.entries(staffServeur.staff).find(
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

    const roleAutoriseRoutine = configRoutine?.data.get("Grade");
    const roleAutoriseJail = configJail?.data.get("Grade");

    const gradesHierarchie = Object.entries(config.grade)
      .sort(([, a], [, b]) => b.priorite - a.priorite)
      .map(([grade]) => grade);

    const utilisateurAutoriseRoutine =
      configRoutine?.active &&
      roleAutoriseRoutine &&
      gradesHierarchie
        .slice(0, gradesHierarchie.indexOf(roleAutoriseRoutine) + 1)
        .includes(gradeDuJoueur);

    const utilisateurAutoriseJail =
      configJail?.active &&
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
        default: true,
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
      name: "gestionstaff_traitement.png",
    });

    const emojiTete = (await getEmojiTete(client, joueur)) || "🧑";

    const container = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## ${emojiTete} Gestion Staff - ${joueur.replace(/_/g, "\\_")}`,
        ),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) => t.setContent(description))
      .addSeparatorComponents((s) => s)
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems((mediaGalleryItem) =>
          mediaGalleryItem.setURL("attachment://gestionstaff_traitement.png"),
        ),
      )
      .addSeparatorComponents((s) => s)
      .addActionRowComponents((row) =>
        row.setComponents(
          new ButtonBuilder()
            .setCustomId(
              `gestionstaff_traitement-/${joueur}/${semaineOffset - 1}`,
            )
            .setLabel("⬅️ Semaine précédente")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`gestionstaff_traitement_status`)
            .setLabel(`Semaine du ${mondayFormatted}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(
              `gestionstaff_traitement-/${joueur}/${semaineOffset + 1}`,
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

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];

  if (hours > 0) parts.push(`${hours} heure${hours > 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
  if (seconds > 0 || parts.length === 0)
    parts.push(`${seconds} seconde${seconds > 1 ? "s" : ""}`);

  return parts.join(" ");
}
