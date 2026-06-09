const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: {
    name: "notation_help",
  },

  async execute(client, interaction, config) {
    let color = interaction.message.components[0].data.accent_color;
    if (!color) {
      color = interaction.message.components[1].data.accent_color;
    }

    const serveur = Object.keys(config.couleur).find((key) => {
      const hexValue = config.couleur[key];
      const decimalValue =
        typeof hexValue === "string" ? parseInt(hexValue, 16) : hexValue;
      return decimalValue === color;
    });

    const informationContainer = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## 🗒️ Informations Supplémentaires"),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          "**⛏️ Commandes Utiles :**\nAjouter un point de notation avec que ton pays soit visité par un OP : ```/f point add <nom-de-la-construction>```\nListe tes points de notation afin de vérifier que tu en as bien mis : ```/f point list```\nSupprime un point de notation si tu t'es trompé en voulant en ajouter : ```/f point remove <numéro>```",
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          "**🚫 Condition afin d'être éligible :**\nPour être éligible aux notations, cet à dire qu'un OP puisse vous accorder des points en architecture, il vous suffit de respecter ces règles :\n- 4 heures de connexion au total par les membres du pays donc 1 heure effectué par les officiers ou le chef.\n- Un assaut devra être effectué où dans le cas contraire un point de notation devra être ajouté.",
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `**⏰ Délais des notations :**\nLes notations sont effectués par les <:super_moderateur:${config.grade.super_moderateur.emoji}> super modérateurs et les <:administrateur:${config.grade.administrateur.emoji}> administrateurs durant le week-end. Que votre pays soit noté le samedi ou le dimanche, vous recevrez votre bourse le lundi midi.`,
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Wiki Notations")
            .setURL(
              "https://wiki.nationsglory.fr/fr/article/les-notations-de-pays-java-gnap9i/",
            )
            .setStyle(ButtonStyle.Link)
            .setEmoji("1319374787570831421"),
        ),
      );

    return interaction.reply({
      components: [informationContainer],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
