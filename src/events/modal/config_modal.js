const { getData, saveData } = require("../../../util/module/getAndSaveData");
const { getServeur } = require("../../../util/module/getServeur");
const { containerSingle } = require("../../../util/container/configSingle");

module.exports = {
  data: {
    name: "config_modal",
  },

  async execute(client, interaction, config) {
    const [_, type, systemName, key] = interaction.customId.split("-");
    const serveur = await getServeur(interaction);

    const configData = getData(`data/${serveur}/config.json`);
    const typeData = configData.find((c) => c.nom === type);
    const data = typeData.systeme[systemName][key];

    data.questions.forEach((q, index) => {
      const value = interaction.fields.getTextInputValue(`question_${index}`);
      q.valeur[interaction.guild.id] = value;
    });

    saveData(`data/${serveur}/config.json`, configData);

    const container = await containerSingle(
      interaction.guild.id,
      serveur,
      systemName,
      typeData,
      type,
    );

    await interaction.update({
      components: [container],
    });
  },
};
