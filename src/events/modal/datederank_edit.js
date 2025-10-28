const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: {
    name: "gestionstaff_datederank_edit",
  },

  async execute(client, interaction, config) {
    if (
      interaction.isModalSubmit() &&
      interaction.customId === "datederank_edit_modal"
    ) {
      const data = interaction.fields.getTextInputValue("datederank-data");

      const embedColor = interaction.message.embeds[0]?.color;

      const serveur = Object.keys(config.couleur).find(
        (key) => config.couleur[key] === embedColor,
      );

      const joueur = interaction.message.embeds[0]?.title
        ?.split("- ")[1]
        ?.trim();

      const embed = new EmbedBuilder()
        .setTitle(`Modification Grade - ${joueur}`)
        .addFields([
          {
            name: "Serveur Impacté :",
            value: `<:NG${serveur.charAt(0).toUpperCase() + serveur.slice(1)}:${
              config.emoji[serveur]
            }> ${serveur.charAt(0).toUpperCase() + serveur.slice(1)}`,
            inline: false,
          },
          { name: "Staff Impacté :", value: `${joueur}`, inline: false },
          { name: "Données à Modifier :", value: `${data}`, inline: false },
        ])
        .setColor(config.couleur[serveur])
        .setFooter({ text: config.footer });

      const userEmbed = new EmbedBuilder()
        .setTitle(`Modification Grade - ${joueur}`)
        .setDescription(
          "Une demande à été faite à l'équipe de GloryStaff afin de modifier manuellement les données que vous m'avez fournit.",
        )
        .setColor(config.couleur[serveur])
        .setFooter({ text: config.footer });

      const channel = await client.channels.fetch("1334943493965217834");
      await channel.send({ embeds: [embed] });
      return interaction.reply({ embeds: [userEmbed], ephemeral: true });
    }
  },
};
