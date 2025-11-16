const { getData, saveData } = require("../../../../util/module/getAndSaveData");
const { getServeur } = require("../../../../util/module/getServeur");
const { containerSingle } = require("../../../../util/container/configSingle");

module.exports = {
  data: {
    name: "config_salon",
  },

  async execute(client, interaction, config) {
    const [_, file, systemName] = interaction.customId.split("-");

    const serveur = await getServeur(interaction);
    const configData = getData(`data/${serveur}/config-${file}.json`);
    configData[systemName].Salon = interaction.values[0];
    saveData(`data/${serveur}/config-${file}.json`, configData);
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
