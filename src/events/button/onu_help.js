const {
  AttachmentBuilder,
  ContainerBuilder,
  MediaGalleryBuilder,
  MessageFlags,
} = require("discord.js");
const { getAbsolutePath } = require("../../../util/module/getAndSaveData");
const { getServeur } = require("../../../util/module/getServeur");

module.exports = {
  data: {
    name: "onu_help",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);

    const imagePath = getAbsolutePath("data/salonetrole.png");

    const attachment = new AttachmentBuilder(imagePath, {
      name: "salonetrole.png",
    });

    const container = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((t) =>
        t.setContent(`## 🌐 Informations Supplémentaires`),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `**Quelles sont les étapes de l'ONU ?**\n- Les rappels\n- Les nouveautés du ${
            config.serveur[serveur].nom
          } et inter-serveur\n- Les réponses aux demandes d'UNESCO\n- Les demandes de tir de missile de tier 4 ou 5\n- Les demandes d'autonuke\n- Les arrivées ou départs\n- Les publicités et questions`,
        ),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          "**Comment faire si je ne vois pas le salon de l'ONU ?**\nIl te suffit de prendre le rôle du serveur sur le discord officiel de nationsglory ([.gg/nationsglory](https://discord.gg/nationsglory)) dans l'onglet \"Salons & Rôles\". Si tu n'y arrives pas, nous te conseillons de regarder l'image ci-joint.",
        ),
      )
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems((mediaGalleryItem) =>
          mediaGalleryItem.setURL("attachment://salonetrole.png"),
        ),
      );

    return interaction.reply({
      files: [attachment],
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
