const { MessageFlags } = require("discord.js");

module.exports = {
  data: {
    name: "routine_antiafk",
  },

  async execute(client, interaction, config) {
    const pseudo = interaction.fields.getTextInputValue("routine_pseudo");
    const temps = interaction.fields.getTextInputValue("routine_temps");

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
    const newInfraction = `\n> Anti-AFK de ${pseudo}${
      temps ? ` avec ${temps} de temps d'ATM` : ""
    }`;

    const newDescription = `${beforeInfractions}${newInfraction}${afterInfractions}`;
    container.components[2].data.content = newDescription;

    await interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
