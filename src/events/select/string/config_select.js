const { getData } = require("../../../../util/module/getAndSaveData");
const { getServeur } = require("../../../../util/module/getServeur");
const { containerSingle } = require("../../../../util/container/configSingle");

module.exports = {
  data: {
    name: "config_select",
  },

  async execute(client, interaction, config) {
    const [_, file, systemName] = interaction.values[0].split("-");

    const serveur = await getServeur(interaction);
    const configData = getData(`data/${serveur}/config-${file}.json`);
    const container = await containerSingle(
      serveur,
      systemName,
      configData,
      file,
    );

    await interaction.update({
      components: [container],
    });
  },
};
