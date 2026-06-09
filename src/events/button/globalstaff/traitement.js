const {
  StringSelectMenuBuilder,
  AttachmentBuilder,
  MessageFlags,
  ContainerBuilder,
  MediaGalleryBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getServeur } = require("../../../../util/module/getServeur");
const {
  generateTableNombreImage,
} = require("../../../../util/connexionTableImage");
const {
  getTotalAttenteStaffTable,
} = require("../../../../util/totalConnexion");
const Configuration = require("../../../../util/database/models/Configuration");
const Serveur = require("../../../../util/database/models/Serveur");

module.exports = {
  data: {
    name: "globalstaff_traitement",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);
    await interaction.deferUpdate({});

    const semaineOffset = Number(interaction.customId.split("/")[1]);

    const monday = new Date();
    const day = monday.getDay();

    const diffToMonday = (day === 0 ? -6 : 1 - day) + semaineOffset * 7;
    monday.setDate(monday.getDate() + diffToMonday);

    const mondayFormatted = monday.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const staffServeur = await Serveur.findOne({
      serveur,
    }).lean();

    const staffList = staffServeur?.staff ?? {};

    const pseudos = Object.values(staffList).flat();

    const { dates, data } = getTotalAttenteStaffTable(
      serveur,
      pseudos,
      semaineOffset,
    );
    const imageBuffer = generateTableNombreImage(dates, data, staffList);

    const attachment = new AttachmentBuilder(imageBuffer, {
      name: "globalstaff_traitement.png",
    });

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
        default: true,
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
        default: false,
        emoji: "1441734905980649695",
      });
    }

    const container = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((t) =>
        t.setContent(
          "## <:traitement:1441495210206036141> Traitement des Attentes Staffs",
        ),
      )
      .addSeparatorComponents((s) => s)
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems((mediaGalleryItem) =>
          mediaGalleryItem.setURL("attachment://globalstaff_traitement.png"),
        ),
      )
      .addSeparatorComponents((s) => s)
      .addActionRowComponents((row) =>
        row.setComponents(
          new ButtonBuilder()
            .setCustomId(`globalstaff_traitement-/${semaineOffset - 1}`)
            .setLabel("⬅️ Semaine précédente")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`globalstaff_traitement_status`)
            .setLabel(`Semaine du ${mondayFormatted}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`globalstaff_traitement-/${semaineOffset + 1}`)
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
