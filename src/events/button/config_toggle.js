const { getData, saveData } = require("../../../util/module/getAndSaveData");
const { getServeur } = require("../../../util/module/getServeur");
const { containerSingle } = require("../../../util/container/configSingle");

module.exports = {
  data: {
    name: "config_toggle",
  },

  async execute(client, interaction, config) {
    const [_, systemName, type] = interaction.customId.split("-");
    const serveur = await getServeur(interaction);

    const configData = getData(`data/${serveur}/config.json`);
    const typeData = configData.find((c) => c.nom === type);

    typeData.systeme[systemName].active[interaction.guild.id] =
      !typeData.systeme[systemName].active[interaction.guild.id];

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
