const { getData } = require("../../../../../util/module/getAndSaveData");
const { getServeur } = require("../../../../../util/module/getServeur");
const {
  containerSingle,
} = require("../../../../../util/container/configSingle");

module.exports = {
  data: {
    name: "config_subconfig",
  },

  async execute(client, interaction, config) {
    const [_, type, systemName] = interaction.values[0].split("-");

    const serveur = await getServeur(interaction);
    const configData = getData(`data/${serveur}/config.json`);
    const typeData = configData.find((c) => c.nom === type);
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
