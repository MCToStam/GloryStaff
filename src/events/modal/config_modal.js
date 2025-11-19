const { getData, saveData } = require("../../../util/module/getAndSaveData");
const { getServeur } = require("../../../util/module/getServeur");
const { containerSingle } = require("../../../util/container/configSingle");

module.exports = {
  data: {
    name: "config_modal",
  },

  async execute(client, interaction, config) {
    const [_, file, systemName, key] = interaction.customId.split("-");
    const serveur = await getServeur(interaction);

    const configData = getData(`data/${serveur}/config-${file}.json`);
    const data = configData[systemName][key];

    data.questions.forEach((q, index) => {
      const value = interaction.fields.getTextInputValue(`question_${index}`);
      q.valeur = value;
    });

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
