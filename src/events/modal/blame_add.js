const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getData, saveData } = require("../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "blame_add_modal",
  },

  async execute(client, interaction, config) {
    if (
      interaction.isModalSubmit() &&
      interaction.customId === "blame_add_modal"
    ) {
      const raison = interaction.fields.getTextInputValue("blame-raison");

      const embedColor = interaction.message.embeds[0]?.color;

      const serveur = Object.keys(config.couleur).find(
        (key) => config.couleur[key] === embedColor,
      );

      const joueur = interaction.message.embeds[0]?.title
        ?.split("- ")[1]
        ?.trim();

      const staffData = getData(
        `data/${serveur}/staff/${joueur.replace(/\\/g, "")}.json`,
      );

      const dateActuelle = new Date();
      const options = { day: "numeric", month: "long", year: "numeric" };
      const dateFormatee = dateActuelle.toLocaleDateString("fr-FR", options);

      if (!staffData["Blâme 1"]) {
        staffData["Blâme 1"] = {
          raison,
          auteur: interaction.user.id,
          date: dateFormatee,
        };
      } else if (!staffData["Blâme 2"]) {
        staffData["Blâme 2"] = {
          raison,
          auteur: interaction.user.id,
          date: dateFormatee,
        };
      } else if (!staffData["Blâme 3"]) {
        staffData["Blâme 3"] = {
          raison,
          auteur: interaction.user.id,
          date: dateFormatee,
        };
      }

      saveData(
        `data/${serveur}/staff/${joueur.replace(/\\/g, "")}.json`,
        staffData,
      );

      const embed = new EmbedBuilder()
        .setTitle(`Blâme - ${joueur}`)
        .setDescription(
          `**Blâme 1 :** ${
            staffData["Blâme 1"]
              ? ` ${staffData["Blâme 1"].raison}\nDélivré par <@${staffData["Blâme 1"].auteur}> le ${staffData["Blâme 1"].date}.`
              : ""
          }\n**Blâme 2 :** ${
            staffData["Blâme 2"]
              ? ` ${staffData["Blâme 2"].raison}\nDélivré par <@${staffData["Blâme 2"].auteur}> le ${staffData["Blâme 2"].date}.`
              : ""
          }\n**Blâme 3 :** ${
            staffData["Blâme 3"]
              ? ` ${staffData["Blâme 3"].raison}\nDélivré par <@${staffData["Blâme 3"].auteur}> le ${staffData["Blâme 3"].date}.`
              : ""
          }`,
        )
        .setColor(config.couleur[serveur])
        .setFooter({ text: config.footer });

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("gestionstaff_blame_remove")
          .setLabel("Retirer le dernier Blâme")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(staffData["Blâme 1"] ? false : true),
        new ButtonBuilder()
          .setCustomId("gestionstaff_blame_add")
          .setLabel("Ajouter un Blâme")
          .setStyle(ButtonStyle.Success)
          .setDisabled(staffData["Blâme 3"] ? true : false),
      );

      return interaction.update({
        embeds: [embed],
        components: [actionRow],
        ephemeral: true,
      });
    }
  },
};
