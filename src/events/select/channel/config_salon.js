const Configuration = require("../../../../util/database/models/Configuration");
const { getServeur } = require("../../../../util/module/getServeur");
const { containerSingle } = require("../../../../util/container/configSingle");
const CONFIG_STATIC = require("../../../../util/config");

module.exports = {
  data: {
    name: "config_salon",
  },

  async execute(client, interaction) {
    const [_, type, systemName, key] = interaction.customId.split("-");

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

    const salon = interaction.values[0];

    doc.data.set(key, salon);

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
