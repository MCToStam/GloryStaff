const { ContainerBuilder, MessageFlags } = require("discord.js");
const { getServeur } = require("../../../util/module/getServeur");
const moduleContainers = require("../../../util/container/module");

module.exports = {
  data: {
    name: "previsualisation",
  },

  async execute(client, interaction, config) {
    const [_, categorie, systeme] = interaction.customId.split("-");
    const serveur = await getServeur(interaction);
    const systemeValue = systeme
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");

    if (
      moduleContainers[systemeValue] &&
      typeof moduleContainers[systemeValue] === "function"
    ) {
      const attentionContainer =
        new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            "La prévisualisation qui suit est une représentation, la forme est celle que vous pouvez retrouver mais les données peuvent être factices.",
          ),
        );

      const { components, files } = await moduleContainers[systemeValue](
        client,
        serveur,
      );

      return interaction.reply({
        components: [attentionContainer, ...components],
        files,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] },
      });
    } else {
      const container = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent("## ❌ Prévisualisation Indisponible"),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            "Ce module ne permet pas encore d'en afficher une prévisualisation, elle sera sûrement disponible bientôt !",
          ),
        );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] },
      });
    }
  },
};
