const { getData, saveData } = require("../../../../util/module/getAndSaveData");
const { getServeur } = require("../../../../util/module/getServeur");
const { containerSingle } = require("../../../../util/container/configSingle");

module.exports = {
  data: {
    name: "config_grade",
  },

  async execute(client, interaction, config) {
    const [_, file, systemName] = interaction.customId.split("-");
    const grade = interaction.values[0].replace("config_grade-", "");

    const serveur = await getServeur(interaction);
    const configData = getData(`data/${serveur}/config-${file}.json`);
    configData[systemName].Grade = grade;
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
