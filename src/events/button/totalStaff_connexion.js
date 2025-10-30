const { getData } = require("../../../util/module/getAndSaveData");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require("discord.js");
const { generateTableImage } = require("../../../util/connexionTableImage");
const { getTotalConnexionTable } = require("../../../util/totalConnexion");

module.exports = {
  data: {
    name: "staff_weektotal",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const parts = interaction.customId.split("/");
    const serveur = parts[2];
    const semaineOffset = parseInt(parts[3]);

    const staffRaw = getData(`data/${serveur}/staff-serveur.json`);
    const staffList = Object.values(staffRaw)
      .filter((v) => Array.isArray(v))
      .flat();

    const { dates, data } = getTotalConnexionTable(
      serveur,
      staffList,
      semaineOffset,
    );
    const imageBuffer = generateTableImage(dates, data, staffRaw);
    const attachment = new AttachmentBuilder(imageBuffer, {
      name: "connexion_staff.png",
    });

    const embed = new EmbedBuilder()
      .setTitle(`📊 Activité hebdomadaire du staff`)
      .setColor(config.couleur[serveur])
      .setImage("attachment://connexion_staff.png")
      .setFooter({ text: config.footer });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`staff_weektotal-${serveur}/${semaineOffset - 1}`)
        .setLabel("⬅️ Semaine précédente")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`staff_weektotal-${serveur}/${semaineOffset + 1}`)
        .setLabel("Semaine suivante ➡️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(semaineOffset >= 0),
    );

    await interaction.update({
      embeds: [embed],
      components: [row],
      files: [attachment],
    });
  },
};
