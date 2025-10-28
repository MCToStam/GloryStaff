const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getData } = require("../../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "totalstaff_liaisonop",
  },

  async execute(client, interaction, config) {
    const embedColor = interaction.message.embeds[0]?.color;

    const serveur = Object.keys(config.couleur).find(
      (key) => config.couleur[key] === embedColor,
    );

    const botStaffData = getData(`data/${serveur}/staff.json`);

    let description = "";
    for (const [grade, members] of Object.entries(botStaffData)) {
      if (members.length > 0) {
        const emoji = config.emojigrade[grade] || "";
        const memberMentions = members.map((id) => `<@${id}>`).join(", ");
        description += `**${emoji} ${grade} :** ${memberMentions}\n`;
      }
    }

    description = description || "Aucun opérateur lié au robot n'a été trouvé.";

    const embed = new EmbedBuilder()
      .setTitle("Liste des Opérateurs liés au robot")
      .setDescription(description)
      .setColor(config.couleur[serveur])
      .setFooter({ text: config.footer });

    if (
      botStaffData.Administrateur.includes(interaction.user.id) ||
      interaction.user.id == config.developpeur
    ) {
      const actionRow = new ActionRowBuilder();
      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId("totalstaff_ajout_sm")
          .setLabel("Ajouter un Super-Modérateur")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("totalstaff_retrait_sm")
          .setLabel("Retirer un Super-Modérateur")
          .setStyle(ButtonStyle.Danger),
      );
      return interaction.reply({
        embeds: [embed],
        components: [actionRow],
        ephemeral: true,
      });
    } else {
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
