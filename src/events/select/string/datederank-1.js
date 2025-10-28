const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getData } = require("../../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "gestionstaff_datederank",
  },

  async execute(client, interaction, config) {
    const embedColor = interaction.message.embeds[0]?.color;

    const serveur = Object.keys(config.couleur).find(
      (key) => config.couleur[key] === embedColor,
    );

    const joueur = interaction.message.embeds[0]?.title
      ?.split("- ")[1]
      ?.trim()
      .replace(/\\/g, "");

    let historique = "";

    const gradesValides = [
      "Guide",
      "Modérateur Test",
      "Modérateur",
      "Modérateur Plus",
      "Super-Modérateur",
      "Administrateur",
    ];

    const data = getData(`data/staff/${joueur}.json`);

    if (data) {
      historique = Object.entries(data)
        .filter(([date, details]) => gradesValides.includes(details.grade))
        .map(
          ([date, details]) =>
            `${config.emojigrade[details.grade]} **${
              details.grade
            } ${details.serveur.charAt(0).toUpperCase()}${details.serveur.slice(
              1,
            )}** : ${date}`,
        )
        .join("\n");
    }

    const embed = new EmbedBuilder()
      .setTitle(`Date de Rank - ${joueur.replace(/_/g, "\\_")}`)
      .setDescription(historique || "Aucune donnée trouvée.")
      .setColor(config.couleur[serveur])
      .setFooter({ text: config.footer });

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("gestionstaff_datederank_edit")
        .setLabel("Modifier les dates de rank")
        .setStyle(ButtonStyle.Primary),
    );

    return interaction.reply({
      embeds: [embed],
      components: [actionRow],
      ephemeral: true,
    });
  },
};
