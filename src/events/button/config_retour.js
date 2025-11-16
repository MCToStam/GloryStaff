const { getData } = require("../../../util/module/getAndSaveData");
const { getServeur } = require("../../../util/module/getServeur");
const { containerMultiple } = require("../../../util/container/configMultiple");

module.exports = {
  data: {
    name: "config_retour",
  },

  conf: {
    type: "User",
  },

  async execute(client, interaction, config) {
    const [_, file] = interaction.customId.split("-");
    const serveur = await getServeur(interaction);

    const configData = getData(`data/${serveur}/config-${file}.json`);

    const container = await containerMultiple(serveur, file, configData);

    await interaction.update({
      components: [container],
    });
  },
};
