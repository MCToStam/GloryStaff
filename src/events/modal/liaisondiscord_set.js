const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  data: {
    name: "liaisondiscord_set_modal",
  },

  async execute(client, interaction, config) {
    const id = interaction.fields.getTextInputValue("liaisondiscord-id");

    const user = await client.users.fetch(id);

    if (!user) {
      return;
    }

    const embedColor = interaction.message.embeds[0]?.color;

    const serveur = Object.keys(config.couleur).find(
      (key) => config.couleur[key] === embedColor,
    );

    const joueur = interaction.message.embeds[0]?.title?.split("- ")[1]?.trim();

    const pseudo = joueur.replace(/\\/g, "");
    await fetch(`${config.glorybot_url}/api/ng-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discord_id: id,
        pseudo_ng: pseudo,
      }),
    });

    const embed = new EmbedBuilder()
      .setTitle(`Liaison Discord - ${joueur}`)
      .setDescription(
        `${
          id
            ? `**${joueur}** est relié au compte Discord <@${id}>.`
            : `**${joueur}** n'est pas relié à un compte Discord.`
        }`,
      )
      .setColor(config.couleur[serveur])
      .setFooter({ text: config.footer });

    const actionRow = new ActionRowBuilder();

    if (id) {
      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId("gestionstaff_liaisondiscord_edit")
          .setLabel("Modifier le compte Discord")
          .setStyle(ButtonStyle.Primary),
      );
    } else {
      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId("gestionstaff_liaisondiscord_add")
          .setLabel("Lier le compte Discord")
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
