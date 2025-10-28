const { EmbedBuilder } = require("discord.js");
const { getAbsolutePath } = require("../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "onu_help",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const embedColor = interaction.message.embeds[0]?.color;

    const serveur = Object.keys(config.couleur).find(
      (key) => config.couleur[key] === embedColor,
    );

    const imagePath = getAbsolutePath("data/salonetrole.png");

    const embed = new EmbedBuilder()
      .setTitle(`Informations Supplémentaires`)
      .setColor(config.couleur[serveur])
      .setDescription(
        `**Quelles sont les étapes de l'ONU ?**\n- Les rappels\n- Les nouveautés du ${
          serveur.charAt(0).toUpperCase() + serveur.slice(1)
        } et inter-serveur\n- Les réponses aux demandes d'UNESCO\n- Les demandes de tir de missile de tier 4 ou 5\n- Les demandes d'autonuke\n- Les arrivées ou départs\n- Les publicités et questions\n\n**Comment faire si je ne vois pas le salon de l'ONU ?**\nIl te suffit de prendre le rôle du serveur sur le discord officiel de nationsglory ([.gg/nationsglory](https://discord.gg/nationsglory)) dans l'onglet \"Salons & Rôles\". Si tu n'y arrives pas, nous te conseillons de regarder l'image ci-joint.`,
      )
      .setImage("attachment://salonetrole.png")
      .setFooter({ text: config.footer });

    return interaction.reply({
      embeds: [embed],
      files: [imagePath],
      ephemeral: true,
    });
  },
};
