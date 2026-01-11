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
const { generateTableImage } = require("../../../../util/connexionTableImage");
const { getTotalVocalTable } = require("../../../../util/totalConnexion");

module.exports = {
  data: {
    name: "globalstaff_activitediscord",
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

    const staffRaw = getData(`data/${serveur}/staff-serveur.json`);
    const staffList = Object.values(staffRaw)
      .filter((v) => Array.isArray(v))
      .flat();

    const { dates, data } = getTotalVocalTable(
      serveur,
      staffList,
      semaineOffset,
    );
    const imageBuffer = generateTableImage(dates, data, staffRaw);

    const attachment = new AttachmentBuilder(imageBuffer, {
      name: "globalstaff_activitediscord.png",
    });

    const container = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## Activité Vocal sur Discord - ${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }`,
        ),
      )
      .addSeparatorComponents((s) => s)
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems((mediaGalleryItem) =>
          mediaGalleryItem.setURL(
            "attachment://globalstaff_activitediscord.png",
          ),
        ),
      )
      .addActionRowComponents((row) =>
        row.setComponents(
          new ButtonBuilder()
            .setCustomId(`globalstaff_activitediscord-/${semaineOffset - 1}`)
            .setLabel("⬅️ Semaine précédente")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`globalstaff_activitediscord_status`)
            .setLabel(`Semaine du ${mondayFormatted}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`globalstaff_activitediscord-/${semaineOffset + 1}`)
            .setLabel("Semaine suivante ➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(semaineOffset >= 0),
        ),
      )
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
                default: true,
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

    return interaction.editReply({
      files: [attachment],
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] },
    });
  },
};
