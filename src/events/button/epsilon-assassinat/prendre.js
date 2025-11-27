const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getData, saveData } = require("../../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "assassinat_epsilon_prendre",
  },

  async execute(client, interaction, config) {
    const data = getData("data/epsilon/assassinat/donnee.json");

    const messageId = interaction.message.id;

    const assassinat = data.find((d) => d.messageId === messageId);
    if (!assassinat) {
      return interaction.reply({
        content:
          "⚠️ Impossible de retrouver cet assassinat dans la base de données.",
        ephemeral: true,
      });
    }

    const index = assassinat.listeAssassin.indexOf(interaction.user.id);

    if (index === -1) {
      if (
        assassinat.listeAssassin.length >= parseInt(assassinat.nombreAssassin)
      ) {
        return interaction.reply({
          content: "❌ La limite d'assassins est déjà atteinte.",
          ephemeral: true,
        });
      }
      assassinat.listeAssassin.push(interaction.user.id);
    } else {
      assassinat.listeAssassin.splice(index, 1);
    }

    saveData("data/epsilon/assassinat/donnee.json", data);

    const embed = EmbedBuilder.from(
      interaction.message.embeds[0],
    ).setDescription(
      `**Pseudo du Client :** ${assassinat.pseudoClient}\n` +
        `**Pseudo de la Cible :** ${assassinat.pseudoCible}\n` +
        `**Nombre d'Assassin :** ${assassinat.nombreAssassin}\n` +
        `**Récupération du Stuff :** ${assassinat.recupStuff}\n` +
        `**Anonymisation du Client :** ${assassinat.anonymisationClient}\n` +
        `**Plus d'Informations :** ${assassinat.plusInfos}\n\n` +
        (assassinat.listeAssassin.length > 0
          ? `*Pris en charge par : <@${assassinat.listeAssassin.join(
              ">, <@",
            )}>*`
          : `*Pris en charge par personne*`),
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("assassinat_epsilon_prendre")
        .setLabel("Prendre en charge l'assassinat")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("assassinat_epsilon_fin-kill")
        .setLabel("Kill effectué à 100%")
        .setStyle(ButtonStyle.Success)
        .setDisabled(assassinat.listeAssassin.length === 0),
      new ButtonBuilder()
        .setCustomId("assassinat_epsilon_fin-echouee")
        .setLabel("Mission Echouée")
        .setStyle(ButtonStyle.Success)
        .setDisabled(assassinat.listeAssassin.length === 0),
    );

    await interaction.update({ embeds: [embed], components: [row] });
  },
};
