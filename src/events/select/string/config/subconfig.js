const { getData } = require("../../../../../util/module/getAndSaveData");
const { getServeur } = require("../../../../../util/module/getServeur");
const {
  containerSingle,
} = require("../../../../../util/container/configSingle");
const {
  containerMultiple,
} = require("../../../../../util/container/configMultiple");
const allConfig = require("../../../../../util/container/allConfig");

module.exports = {
  data: {
    name: "config_subconfig",
  },

  async execute(client, interaction, config) {
    const [_, typeInteraction, type, systemName] =
      interaction.values[0].split("-");

    const serveur = await getServeur(interaction);
    if (typeInteraction === "second") {
      const configData = getData(`data/${serveur}/config.json`);
      const typeData = configData.find((c) => c.nom === type);
      const container = await containerSingle(
        interaction.guild.id,
        serveur,
        systemName,
        typeData,
        type,
      );

      return interaction.update({
        components: [container],
      });
    } else if (typeInteraction === "main") {
      const configData = getData(`data/${serveur}/config.json`);
      const typeData = configData.find((c) => c.nom === type);
      const keys = Object.keys(typeData.systeme);

      if (keys.length === 1) {
        const systemName = keys[0];
        const container = await containerSingle(
          interaction.guild.id,
          serveur,
          systemName,
          typeData,
          type,
        );
        return interaction.update({
          components: [container],
        });
      } else {
        const container = await containerMultiple(
          interaction.guild.id,
          serveur,
          type,
          typeData,
        );
        return interaction.update({
          components: [container],
        });
      }
    } else if (typeInteraction === "home") {
      const container = await allConfig(serveur, interaction.user.id);
      return interaction.update({
        components: [container],
      });
    }
  },
};
