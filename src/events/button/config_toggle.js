const { getData, saveData } = require("../../../util/module/getAndSaveData");
const { getServeur } = require("../../../util/module/getServeur");
const { containerSingle } = require("../../../util/container/configSingle");

module.exports = {
  data: {
    name: "config_toggle",
  },

  conf: {
    type: "User",
  },

  async execute(client, interaction, config) {
    const [_, systemName, file] = interaction.customId.split("-");
    const serveur = await getServeur(interaction);

    const configData = getData(`data/${serveur}/config-${file}.json`);

    const currentState = configData[systemName].active;
    configData[systemName].active = !currentState;

    saveData(`data/${serveur}/config-${file}.json`, configData);

    const container = await containerSingle(
      serveur,
      systemName,
      configData[systemName],
      file,
    );

    await interaction.update({
      components: [container],
    });
  },
};
