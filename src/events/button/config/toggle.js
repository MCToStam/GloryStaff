const Configuration = require("../../../../util/database/models/Configuration");
const { getServeur } = require("../../../../util/module/getServeur");
const { containerSingle } = require("../../../../util/container/configSingle");
const CONFIG_STATIC = require("../../../../util/config");

module.exports = {
  data: {
    name: "config_toggle",
  },

  async execute(client, interaction) {
    const [_, systemName, type] = interaction.customId.split("-");
    const serveur = await getServeur(interaction);

    const configDoc = await Configuration.findOne({
      serveur,
      categorie: type,
      systeme: systemName,
      guildId: interaction.guild.id,
    });

    let doc = configDoc;
    if (!doc) {
      doc = await Configuration.create({
        serveur,
        categorie: type,
        systeme: systemName,
        guildId: interaction.guild.id,
        active: false,
      });
    }

    doc.active = !doc.active;
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
