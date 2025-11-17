const { getData, saveData } = require("../../../../util/module/getAndSaveData");
const { getServeur } = require("../../../../util/module/getServeur");
const { containerSingle } = require("../../../../util/container/configSingle");

module.exports = {
  data: {
    name: "config_select",
  },

  async execute(client, interaction, config) {
    const [_, file, systemName, param] = interaction.customId.split("-");
    const valeur = interaction.values[0].replace("config_select-", "");

    const serveur = await getServeur(interaction);
    const configData = getData(`data/${serveur}/config-${file}.json`);
    configData[systemName][param].valeur = valeur;
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
