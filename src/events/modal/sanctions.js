const {
  MessageFlags,
  ContainerBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getServeur } = require("../../../util/module/getServeur");
const {
  saveImage,
  getAbsolutePath,
} = require("../../../util/module/getAndSaveData");
const fs = require("node:fs");

module.exports = {
  data: {
    name: "sanctions",
  },

  async execute(client, interaction, config) {
    const file = interaction.fields.getUploadedFiles("tableau").first();

    const allowedMimeTypes = ["image/png", "image/jpeg"];

    if (!allowedMimeTypes.includes(file.contentType)) {
      const erreurContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((t) =>
          t.setContent("## ❌ Fichier non Valide"),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent("Le fichier donné doit être une image valide."),
        );

      return interaction.reply({
        components: [erreurContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const serveur = await getServeur(interaction);
    const type = interaction.customId.split("-")[1];

    const response = await fetch(file.url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    saveImage(`data/${serveur}/sanctions-${type}.png`, buffer);

    const typeMap = {
      chat: "Tchat",
      vocal: "Vocal",
      game: "En Jeu",
    };

    const imagePath = getAbsolutePath(`data/${serveur}/sanctions-${type}.png`);
    const imageExists = fs.existsSync(imagePath);

    const container = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((t) =>
        t.setContent(`## 💢 Tableau des Sanctions - ${typeMap[type]}`),
      )
      .addSeparatorComponents((s) => s);

    if (imageExists) {
      container
        .addMediaGalleryComponents((m) =>
          m.addItems((mediaGalleryItem) =>
            mediaGalleryItem.setURL("attachment://sanctions.png"),
          ),
        )
        .addSeparatorComponents((s) => s)
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`sanctions-${type}`)
              .setLabel("➕ Définir le Tableau des Sanctions")
              .setStyle(ButtonStyle.Primary),
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
                  label: "En Jeu",
                  value: "sanctions-game",
                  emoji: "1472690903318528020",
                  default: type === "game",
                },
              ]),
          ),
        );

      const attachment = new AttachmentBuilder(imagePath, {
        name: "sanctions.png",
      });

      return interaction.update({
        components: [container],
        files: [attachment],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    container
      .addTextDisplayComponents((t) =>
        t.setContent(
          "Aucun tableau de sanction n'est disponible pour cette catégorie.",
        ),
      )
      .addSeparatorComponents((s) => s)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`sanctions-${type}`)
            .setLabel("➕ Définir le Tableau des Sanctions")
            .setStyle(ButtonStyle.Primary),
        ),
      );

    container
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
                label: "En Jeu",
                value: "sanctions-game",
                emoji: "1472690903318528020",
                default: type === "game",
              },
            ]),
        ),
      );

    return interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
