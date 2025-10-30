const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getData, saveData } = require("../../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "assassinat_epsilon_prendre2",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const data = getData("data/epsilon/assassinat/donnee2.json");

    const messageId = interaction.message.id;

    const assassinat = data.find((d) => d.messageId === messageId);
    if (!assassinat) {
      return interaction.reply({
        content:
          "⚠️ Impossible de retrouver cet assassinat dans la base de données.",
        ephemeral: true,
      });
    }

    const index = assassinat.listeDefenseur.indexOf(interaction.user.id);

    if (index === -1) {
      if (
        assassinat.listeDefenseur.length >= parseInt(assassinat.nombreDefenseur)
      ) {
        return interaction.reply({
          content: "❌ La limite de defenseur est déjà atteinte.",
          ephemeral: true,
        });
      }
      assassinat.listeDefenseur.push(interaction.user.id);
    } else {
      assassinat.listeDefenseur.splice(index, 1);
    }

    saveData("data/epsilon/assassinat/donnee.json", data);

    const embed = EmbedBuilder.from(
      interaction.message.embeds[0],
    ).setDescription(
      `**Pseudo du Client :** ${assassinat.pseudoClient}\n` +
        `**Nombre de Defenseur :** ${
          assassinat.nombreDefenseur.split(" ")[0]
        }\n` +
        `**Fournir le Stuff :** ${assassinat.fournirStuff}\n` +
        `**Récupération du Stuff :** ${assassinat.recupStuff}\n` +
        (assassinat.listeDefenseur.length > 0
          ? `*Pris en charge par : <@${assassinat.listeDefenseur.join(
              ">, <@",
            )}>*`
          : `*Pris en charge par personne*`),
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("assassinat_epsilon_prendre2")
        .setLabel("Prendre en charge l'assassinat")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("assassinat_epsilon_fin2-kill")
        .setLabel("Kill effectué à 100%")
        .setStyle(ButtonStyle.Success)
        .setDisabled(assassinat.listeAssassin.length === 0),
      new ButtonBuilder()
        .setCustomId("assassinat_epsilon_fin2-echouee")
        .setLabel("Mission Echouée")
        .setStyle(ButtonStyle.Success)
        .setDisabled(assassinat.listeAssassin.length === 0),
    );

    await interaction.update({ embeds: [embed], components: [row] });
  },
};
