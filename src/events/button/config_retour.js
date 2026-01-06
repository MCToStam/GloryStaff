const { getData } = require("../../../util/module/getAndSaveData");
const { getServeur } = require("../../../util/module/getServeur");
const { containerMultiple } = require("../../../util/container/configMultiple");

module.exports = {
  data: {
    name: "config_retour",
  },

  async execute(client, interaction, config) {
    const [_, type] = interaction.customId.split("-");
    const serveur = await getServeur(interaction);

    const configData = getData(`data/${serveur}/config.json`);
    const typeData = configData.find((c) => c.nom === type);

    const container = await containerMultiple(
      interaction.guild.id,
      serveur,
      type,
      typeData,
    );

    await interaction.update({
      components: [container],
    });
  },
};
