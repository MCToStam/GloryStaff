const { MessageFlags } = require("discord.js");

module.exports = {
  data: {
    name: "routine_autre",
  },

  async execute(client, interaction, config) {
    const details = interaction.fields.getTextInputValue("routine_details");

    const container = interaction.message.components[0];
    let description = container.components[2].data.content || "";

    const infractionMarker = "**Infractions :**";
    const infractionIndex = description.indexOf(infractionMarker);

    const beforeInfractions = description.substring(
      0,
      infractionIndex + infractionMarker.length,
    );
    const afterInfractions = description.substring(
      infractionIndex + infractionMarker.length,
    );
    const newInfraction = `\n> Autre : ${details}`;

    const newDescription = `${beforeInfractions}${newInfraction}${afterInfractions}`;
    container.components[2].data.content = newDescription;

    await interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
