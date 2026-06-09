const {
  StringSelectMenuBuilder,
  AttachmentBuilder,
  MessageFlags,
  ContainerBuilder,
  MediaGalleryBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getData } = require("../../../../util/module/getAndSaveData");
const { getServeur } = require("../../../../util/module/getServeur");
const {
  generateTableNombreImage,
} = require("../../../../util/connexionTableImage");
const Configuration = require("../../../../util/database/models/Configuration");
const Serveur = require("../../../../util/database/models/Serveur");

module.exports = {
  data: {
    name: "globalstaff_routine",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);
    const routineData = getData(`data/${serveur}/routine.json`) || {};

    await interaction.deferUpdate({});

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

    const semaineOffset = Number(interaction.customId.split("/")[1]);
    const today = new Date();

    const monday = new Date(today);
    const day = monday.getDay();

    const diffToMonday = (day === 0 ? -6 : 1 - day) + semaineOffset * 7;
    monday.setDate(monday.getDate() + diffToMonday);

    const mondayFormatted = monday.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const dates = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);

      const jour = date.getDate().toString().padStart(2, "0");
      const mois = (date.getMonth() + 1).toString().padStart(2, "0");

      dates.push(`${jour}-${mois}`);
    }

    const staffServeur = await Serveur.findOne({
      serveur,
    }).lean();

    const gradesHierarchie = Object.entries(config.grade)
      .sort(([, a], [, b]) => b.priorite - a.priorite)
      .map(([grade]) => grade);

    const gradeAutorise = configRoutine?.data?.get("Grade");

    const indexGradeAutorise = gradesHierarchie.indexOf(gradeAutorise);

    const staffAutorise = {};

    for (const [grade, membres] of Object.entries(staffServeur.staff)) {
      if (!Array.isArray(membres)) continue;
      const indexGrade = gradesHierarchie.indexOf(grade);
      if (indexGrade === -1) continue;
      if (indexGrade > indexGradeAutorise) continue;

      membres.forEach((pseudo) => {
        if (pseudo && typeof pseudo === "string") {
          staffAutorise[pseudo] = grade;
        }
      });
    }

    const data = {};

    for (const pseudo of Object.keys(staffAutorise)) {
      data[pseudo] = dates.map((date) => {
        const routines = routineData[pseudo]?.routine || [];

        const nombre = routines.filter((timestamp) => {
          const routineDate = new Date(timestamp * 1000);

          const jour = routineDate.getDate().toString().padStart(2, "0");

          const mois = (routineDate.getMonth() + 1).toString().padStart(2, "0");

          return `${jour}-${mois}` === date;
        }).length;

        return nombre;
      });
    }

    const imageBuffer = generateTableNombreImage(
      dates,
      data,
      staffServeur.staff,
    );

    const attachment = new AttachmentBuilder(imageBuffer, {
      name: "globalstaff_routine.png",
    });

    const options = [
      {
        label: "Liste des Staffs",
        value: "globalstaff_liste",
        default: false,
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
    ];

    if (configJail) {
      options.push({
        label: "Jail",
        value: "globalstaff_jail",
        default: false,
        emoji: "1441734907260043264",
      });
    }

    if (configRoutine) {
      options.push({
        label: "Routine",
        value: "globalstaff_routine",
        default: true,
        emoji: "1441734905980649695",
      });
    }

    const container = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((t) =>
        t.setContent("## <:routine:1441734905980649695> Routine"),
      )
      .addSeparatorComponents((s) => s)
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems((mediaGalleryItem) =>
          mediaGalleryItem.setURL("attachment://globalstaff_routine.png"),
        ),
      )
      .addSeparatorComponents((s) => s)
      .addActionRowComponents((row) =>
        row.setComponents(
          new ButtonBuilder()
            .setCustomId(`globalstaff_routine-/${semaineOffset - 1}`)
            .setLabel("⬅️ Semaine précédente")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("globalstaff_routine_status")
            .setLabel(`Semaine du ${mondayFormatted}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`globalstaff_routine-/${semaineOffset + 1}`)
            .setLabel("Semaine suivante ➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(semaineOffset >= 0),
        ),
      )
      .addSeparatorComponents((s) => s)
      .addActionRowComponents((row) =>
        row.setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("globalstaff")
            .setPlaceholder("Choisit une option")
            .setOptions(options),
        ),
      );

    return interaction.editReply({
      files: [attachment],
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] },
    });
  },
};
