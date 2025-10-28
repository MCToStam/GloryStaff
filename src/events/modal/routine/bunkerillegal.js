const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: {
    name: "routine_bunkerillegal",
  },

  async execute(client, interaction, config) {
    const coordonnees =
      interaction.fields.getTextInputValue("routine_coordonne");
    const pseudo = interaction.fields.getTextInputValue("routine_pseudo");

    const oldEmbed = interaction.message.embeds[0];

    let description = oldEmbed.description || "";

    const infractionMarker = "**Infractions :**";
    const infractionIndex = description.indexOf(infractionMarker);

    const beforeInfractions = description.substring(
      0,
      infractionIndex + infractionMarker.length,
    );
    const afterInfractions = description.substring(
      infractionIndex + infractionMarker.length,
    );
    const newInfraction = `\n> Bunker Illégal de ${pseudo} : ${coordonnees}`;

    const newDescription = `${beforeInfractions}${newInfraction}${afterInfractions}`;

    const updatedEmbed = new EmbedBuilder(oldEmbed).setDescription(
      newDescription,
    );

    await interaction.update({
      embeds: [updatedEmbed],
      files: [],
      ephemeral: true,
    });
  },
};
