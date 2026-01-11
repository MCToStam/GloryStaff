const {
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
} = require("discord.js");
const { getData } = require("../../../util/module/getAndSaveData");
const { getServeur } = require("../../../util/module/getServeur");

module.exports = {
  data: {
    name: "informations_supplementaires",
  },

  async execute(client, interaction, config) {
    const module = interaction.customId.split("-")[1];

    const serveur = await getServeur(interaction);

    const configData = getData(`data/${serveur}/config.json`);
    const systemeData = configData.find((c) => c.systeme?.[module]);
    const systeme = systemeData.systeme[module];

    const container = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `## ${config.emoji_formate[serveur]} Information Supplémentaire - ${module}`,
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          systeme.details ||
            "Aucune information supplémentaire n'est disponible pour ce module.",
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`previsualisation-${module}`)
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
