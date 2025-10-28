const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  data: {
    name: "gestionstaff_liaisonminecraft",
  },

  async execute(client, interaction, config) {
    const embedColor = interaction.message.embeds[0]?.color;

    const serveur = Object.keys(config.couleur).find(
      (key) => config.couleur[key] === embedColor,
    );

    const joueur = interaction.message.embeds[0]?.title?.split("- ")[1]?.trim();
    const pseudo = joueur.replace(/\\/g, "");

    let linkedMinecraftPseudonym;
    try {
      const responseLinked = await fetch(
        `${config.glorybot_url}/api/get-bedrock?pseudo_ng=${encodeURIComponent(
          pseudo,
        )}`,
      );
      if (!responseLinked.ok)
        throw new Error(`Erreur API: ${responseLinked.status}`);
      const data = await responseLinked.json();

      linkedMinecraftPseudonym = data.pseudo_mc || null;
    } catch (e) {
      linkedMinecraftPseudonym = null;
    }

    const embed = new EmbedBuilder()
      .setTitle(`Liaison Minecraft - ${joueur}`)
      .setDescription(
        `${
          linkedMinecraftPseudonym
            ? `**${joueur}** est relié au compte Minecraft **${linkedMinecraftPseudonym}**.`
            : `**${joueur}** n'est pas relié à un compte Minecraft.`
        }`,
      )
      .setColor(config.couleur[serveur])
      .setFooter({ text: config.footer });

    const actionRow = new ActionRowBuilder();

    if (linkedMinecraftPseudonym) {
      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId("gestionstaff_liaisonminecraft_edit")
          .setLabel("Modifier le compte Minecraft")
          .setStyle(ButtonStyle.Primary),
      );
    } else {
      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId("gestionstaff_liaisonminecraft_add")
          .setLabel("Lier le compte Minecraft")
          .setStyle(ButtonStyle.Primary),
      );
    }

    return interaction.reply({
      embeds: [embed],
      components: [actionRow],
      ephemeral: true,
    });
  },
};
