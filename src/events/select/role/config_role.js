const { getData, saveData } = require("../../../../util/module/getAndSaveData");
const { getServeur } = require("../../../../util/module/getServeur");
const { containerSingle } = require("../../../../util/container/configSingle");

module.exports = {
  data: {
    name: "config_role",
  },

  async execute(client, interaction, config) {
    const [_, type, systemName] = interaction.customId.split("-");

    const serveur = await getServeur(interaction);
    const configData = getData(`data/${serveur}/config.json`);
    const typeData = configData.find((c) => c.nom === type);
    typeData.systeme[systemName].Role.valeur[interaction.guild.id] =
      interaction.values;
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
