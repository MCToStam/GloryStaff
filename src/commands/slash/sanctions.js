const {
  SlashCommandBuilder,
  ContainerBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} = require("discord.js");
const { getAbsolutePath } = require("../../../util/module/getAndSaveData");
const proxyCommande = require("../../../util/proxy/proxyCommande");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sanctions")
    .setDescription("Affiche les sanctions et les paliers de toxicité"),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur } = interaction.parametre;

    if (config.liste_serveur_java.includes(serveur)) {
      const container = new ContainerBuilder()
        .setAccentColor(config.couleur[serveur])
        .addTextDisplayComponents((t) =>
          t.setContent("## 💢 Tableau des Sanctions - Tchat"),
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
                  default: true,
                },
                {
                  label: "Vocal",
                  value: "sanctions-vocal",
                  emoji: "1472690904555978752",
                },
                {
                  label: "En Jeu",
                  value: "sanctions-game",
                  emoji: "1472690903318528020",
                },
              ]),
          ),
        );

      const imagePath = getAbsolutePath("data/sanctions-chat.png");

      const attachment = new AttachmentBuilder(imagePath, {
        name: "sanctions.png",
      });

      if (interaction.isMessageComponent()) {
        return interaction.update({
          components: [container],
          files: [attachment],
          flags: MessageFlags.IsComponentsV2,
        });
      } else {
        return interaction.reply({
          components: [container],
          files: [attachment],
          flags: MessageFlags.IsComponentsV2,
        });
      }
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

      if (interaction.isMessageComponent()) {
        return interaction.update({
          components: [erreurContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      } else {
        return interaction.reply({
          components: [erreurContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      }
    }
  },
};
