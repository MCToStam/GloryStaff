const {
  StringSelectMenuBuilder,
  MessageFlags,
  ContainerBuilder,
  ButtonStyle,
  AttachmentBuilder,
  MediaGalleryBuilder,
  ButtonBuilder,
} = require("discord.js");
const { getEmojiTete } = require("../../../../util/module/emoji");
const { getServeur } = require("../../../../util/module/getServeur");
const {
  generateConnexionTimeline,
  getConnexionResume,
} = require("../../../../util/generateConnexionTimeline");
const Configuration = require("../../../../util/database/models/Configuration");
const Serveur = require("../../../../util/database/models/Serveur");

module.exports = {
  data: {
    name: "gestionstaff_activitediscord",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);
    const joueur = interaction.customId.split("/")[1];
    const semaineOffset = Number(interaction.customId.split("/")[2]);

    await interaction.deferUpdate();

    const description = await getConnexionResume(
      serveur,
      joueur,
      semaineOffset,
    );

    const buffer = await generateConnexionTimeline(
      serveur,
      joueur,
      semaineOffset,
    );

    const base = new Date();
    const currentDay = base.getDay();
    const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
    base.setDate(base.getDate() + diffToMonday);
    base.setDate(base.getDate() + semaineOffset * 7);

    const monday = new Date();
    const currentDay2 = monday.getDay();
    const diffToMonday2 = (currentDay2 === 0 ? -6 : 1) - currentDay2;
    monday.setDate(monday.getDate() + diffToMonday2 + semaineOffset * 7);

    const mondayFormatted = monday.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

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
        default: true,
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
      name: "gestionstaff_activitediscord.png",
    });

    const emojiTete = (await getEmojiTete(client, joueur)) || "⏱️";

    const container = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## ${emojiTete} Gestion Staff - ${joueur.replace(/\\/g, "\\\\").replace(/_/g, "\\_")}`,
        ),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) => t.setContent(description))
      .addSeparatorComponents((s) => s)
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems((mediaGalleryItem) =>
          mediaGalleryItem.setURL(
            "attachment://gestionstaff_activitediscord.png",
          ),
        ),
      )
      .addSeparatorComponents((s) => s)
      .addActionRowComponents((row) =>
        row.setComponents(
          new ButtonBuilder()
            .setCustomId(
              `gestionstaff_activitediscord-/${joueur}/${semaineOffset - 1}`,
            )
            .setLabel("⬅️ Semaine précédente")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`gestionstaff_activitediscord_status`)
            .setLabel(`Semaine du ${mondayFormatted}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(
              `gestionstaff_activitediscord-/${joueur}/${semaineOffset + 1}`,
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
