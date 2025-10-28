const {
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: {
    name: "jail_previsualisation_finish",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const embed = new EmbedBuilder()
      .setTitle("Prévisualitation")
      .setColor(config.errorcolor)
      .setDescription(
        "Le bouton censé effectuer un jail et donc le terminer n'est pas fonctionnel sur une prévisualisation. En cas réel, il supprime le message, le fil et n'alerte plus lors des connexions ou déconnexions du joueur."
      )
      .setFooter({ text: config.footer });
    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
