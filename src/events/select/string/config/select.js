const Configuration = require("../../../../../util/database/models/Configuration");
const { getServeur } = require("../../../../../util/module/getServeur");
const {
  containerSingle,
} = require("../../../../../util/container/configSingle");
const CONFIG_STATIC = require("../../../../../util/config");

module.exports = {
  data: {
    name: "config_select",
  },

  async execute(client, interaction, config) {
    const [_, type, systemName, param] = interaction.customId.split("-");

    const valeur = interaction.values[0].replace("config_select-", "");

    const serveur = await getServeur(interaction);

    let doc = await Configuration.findOne({
      serveur,
      categorie: type,
      systeme: systemName,
      guildId: interaction.guild.id,
    });

    if (!doc) {
      doc = new Configuration({
        serveur,
        categorie: type,
        systeme: systemName,
        guildId: interaction.guild.id,
        active: false,
        data: {},
      });
    }

    doc.data.set(param, valeur);

    await doc.save();

    const typeData = CONFIG_STATIC.find((c) => c.nom === type);
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
