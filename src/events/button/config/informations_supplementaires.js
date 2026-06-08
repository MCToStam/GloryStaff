const {
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
} = require("discord.js");
const { getServeur } = require("../../../../util/module/getServeur");
const CONFIG_STATIC = require("../../../../util/config");

module.exports = {
  data: {
    name: "informations_supplementaires",
  },

  async execute(client, interaction, config) {
    const [_, categorie, systeme] = interaction.customId.split("-");
    const serveur = await getServeur(interaction);

    const categorieData = CONFIG_STATIC.find((c) => c.nom === categorie);
    const systemeData = categorieData.systeme[systeme];

    const container = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `## ${config.emoji_formate[serveur]} Information Supplémentaire - ${systeme}`,
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          systemeData.details ||
            "Aucune information supplémentaire n'est disponible pour ce module.",
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`previsualisation-${categorie}-${systeme}`)
            .setLabel("🔎 Afficher la Prévisualisation")
            .setStyle(ButtonStyle.Primary),
        ),
      );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
