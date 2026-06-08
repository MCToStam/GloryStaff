const Configuration = require("../../../util/database/models/Configuration");
const { getServeur } = require("../../../util/module/getServeur");
const { containerSingle } = require("../../../util/container/configSingle");
const CONFIG_STATIC = require("../../../util/config");

module.exports = {
  data: {
    name: "config_modal",
  },

  async execute(client, interaction) {
    const [_, type, systemName, key] = interaction.customId.split("-");
    const serveur = await getServeur(interaction);

    const doc =
      (await Configuration.findOne({
        serveur,
        categorie: type,
        systeme: systemName,
        guildId: interaction.guild.id,
      })) ||
      new Configuration({
        serveur,
        categorie: type,
        systeme: systemName,
        guildId: interaction.guild.id,
        active: false,
        data: {},
      });

    const values = interaction.fields.fields;

    if (!doc.data.has(key)) doc.data.set(key, []);

    values.forEach((field, index) => {
      const value = interaction.fields.getTextInputValue(field.customId);
      const array = doc.data.get(key);

      if (array[index] !== undefined) {
        array[index] = value;
      } else {
        array.push(value);
      }
    });

    doc.markModified("data");
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
