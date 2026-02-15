const {
  ContainerBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} = require("discord.js");
const { getServeur } = require("../../../../util/module/getServeur");
const { getAbsolutePath } = require("../../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "sanctions",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);
    const type = interaction.values[0].split("-")[1];

    const typeMap = {
      chat: "Tchat",
      vocal: "Vocal",
      game: "En Jeu",
    };

    if (config.liste_serveur_java.includes(serveur)) {
      const container = new ContainerBuilder()
        .setAccentColor(config.couleur[serveur])
        .addTextDisplayComponents((t) =>
          t.setContent(`## 💢 Tableau des Sanctions - ${typeMap[type]}`),
        )
        .addSeparatorComponents((s) => s)
        .addMediaGalleryComponents((m) =>
          m.addItems((mediaGalleryItem) =>
            mediaGalleryItem.setURL("attachment://sanctions.png"),
          ),
        )
        .addSeparatorComponents((s) => s)
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("sanctions")
              .setPlaceholder("Sélectionnez un type de sanctions")
              .addOptions([
                {
                  label: "Tchat",
                  value: "sanctions-chat",
                  emoji: "1472690901972160613",
                  default: type === "chat",
                },
                {
                  label: "Vocal",
                  value: "sanctions-vocal",
                  emoji: "1472690904555978752",
                  default: type === "vocal",
                },
                {
                  label: "En Jeu",
                  value: "sanctions-game",
                  emoji: "1472690903318528020",
                  default: type === "game",
                },
              ]),
          ),
        );

      const imagePath = getAbsolutePath(`data/sanctions-${type}.png`);

      const attachment = new AttachmentBuilder(imagePath, {
        name: "sanctions.png",
      });

      return interaction.update({
        components: [container],
        files: [attachment],
        flags: MessageFlags.IsComponentsV2,
      });
    } else {
      const erreurContainer = new ContainerBuilder()
        .setAccentColor(config.couleur[serveur])
        .addTextDisplayComponents((t) =>
          t.setContent(`## ❌ Commande en Développement`),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            "Cette commande est actuellement en cours de développement pour les serveurs Bedrock. Elle sera disponible prochainement...",
          ),
        );

      return interaction.update({
        components: [erreurContainer],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  },
};
