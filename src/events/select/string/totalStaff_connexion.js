const { getAbsolutePath, getData } = require("../../../../util/module/getAndSaveData");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require("discord.js");
const { generateTableImage } = require("../../../../util/connexionTableImage");
const { getTotalConnexionTable } = require("../../../../util/totalConnexion");

module.exports = {
  name: "interactionCreate",
  async execute(client, interaction, config) {
    const isStaffMenu =
      interaction.isSelectMenu() &&
      interaction.values[0] === "totalstaff_connexion";
    const isStaffButton =
      interaction.isButton() &&
      interaction.customId.startsWith("staff/weektotal/");

    if (!isStaffMenu && !isStaffButton) return;

    let semaineOffset = 0;
    let serveur = null;

    if (isStaffMenu) {
      const embedColor = interaction.message.embeds[0]?.color;

      serveur = Object.keys(config.couleur).find(
        (key) => config.couleur[key] === embedColor
      );

      const today = new Date();
      if (today.getDay() === 1) {
        semaineOffset = -1;
      }
    }

    if (isStaffButton) {
      const parts = interaction.customId.split("/");
      serveur = parts[2];
      semaineOffset = parseInt(parts[3]);
    }

    const staffRaw = getData(`data/${serveur}/staff-serveur.json`)
    const staffList = Object.values(staffRaw)
      .filter((v) => Array.isArray(v))
      .flat();

    const { dates, data } = getTotalConnexionTable(
      serveur,
      staffList,
      semaineOffset
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
        .setCustomId(`staff/weektotal/${serveur}/${semaineOffset - 1}`)
        .setLabel("⬅️ Semaine précédente")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`staff/weektotal/${serveur}/${semaineOffset + 1}`)
        .setLabel("Semaine suivante ➡️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(semaineOffset >= 0)
    );

    if (interaction.isSelectMenu()) {
      await interaction.reply({
        embeds: [embed],
        components: [row],
        files: [attachment],
        ephemeral: true,
      });
    } else {
      await interaction.update({
        embeds: [embed],
        components: [row],
        files: [attachment],
      });
    }
  },
};
