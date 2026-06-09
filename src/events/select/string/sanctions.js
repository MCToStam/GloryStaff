const {
  ContainerBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getAbsolutePath } = require("../../../../util/module/getAndSaveData");
const { discordStaff } = require("../../../../util/module/discordLink");
const { getServeur } = require("../../../../util/module/getServeur");
const fs = require("node:fs");
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
        .setAccentColor(config.serveur[serveur].couleur)
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
      const { servers } = await discordStaff(
        interaction.user.id,
        serveur,
        "super_moderateur",
      );

      const imagePath = getAbsolutePath(
        `data/${serveur}/sanctions-${type}.png`,
      );
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

      container.addTextDisplayComponents((t) =>
        t.setContent(
          "Aucun tableau de sanction n'est disponible pour cette catégorie.",
        ),
      );

      if (servers.includes(serveur)) {
        container.addSeparatorComponents((s) => s);

        container.addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`sanctions-${type}`)
              .setLabel("➕ Définir le Tableau des Sanctions")
              .setStyle(ButtonStyle.Primary),
          ),
        );
      }

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
                  default: true,
                },
                {
                  label: "En Jeu",
                  value: "sanctions-game",
                  emoji: "1472690903318528020",
                },
              ]),
          ),
        );

      return interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  },
};
