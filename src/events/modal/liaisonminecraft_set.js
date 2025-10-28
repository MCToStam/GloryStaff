const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  data: {
    name: "liaisonminecraft_set_modal",
  },

  async execute(client, interaction, config) {
    const pseudo_mc = interaction.fields.getTextInputValue(
      "liaisonminecraft-id",
    );

    const embedColor = interaction.message.embeds[0]?.color;

    const serveur = Object.keys(config.couleur).find(
      (key) => config.couleur[key] === embedColor,
    );

    const joueur = interaction.message.embeds[0]?.title?.split("- ")[1]?.trim();

    const pseudo = joueur.replace(/\\/g, "");
    await fetch(`${config.glorybot_url}/api/bedrock-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pseudo_mc: pseudo_mc,
        pseudo_ng: pseudo,
      }),
    });

    const embed = new EmbedBuilder()
      .setTitle(`Liaison Minecraft - ${joueur}`)
      .setDescription(
        `${
          pseudo_mc
            ? `**${joueur}** est relié au compte Minecraft **${pseudo_mc}**.`
            : `**${joueur}** n'est pas relié à un compte Minecraft.`
        }`,
      )
      .setColor(config.couleur[serveur])
      .setFooter({ text: config.footer });

    const actionRow = new ActionRowBuilder();

    if (pseudo_mc) {
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

    return interaction.update({
      embeds: [embed],
      components: [actionRow],
      ephemeral: true,
    });
  },
};
