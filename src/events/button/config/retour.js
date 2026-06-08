const { getServeur } = require("../../../../util/module/getServeur");
const {
  containerMultiple,
} = require("../../../../util/container/configMultiple");
const allConfig = require("../../../../util/container/allConfig");
const CONFIG_STATIC = require("../../../../util/config");

module.exports = {
  data: {
    name: "config_retour",
  },

  async execute(client, interaction, config) {
    const [_, typeInteraction, type] = interaction.customId.split("-");
    const serveur = await getServeur(interaction);

    if (typeInteraction === "back") {
      const typeData = CONFIG_STATIC.find((c) => c.nom === type);

      const container = await containerMultiple(
        interaction.guild.id,
        serveur,
        type,
        typeData,
      );

      await interaction.update({
        components: [container],
      });
    } else if (typeInteraction === "home") {
      const container = await allConfig(serveur, interaction.user.id);
      return interaction.update({
        components: [container],
      });
    }
  },
};
