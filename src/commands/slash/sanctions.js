const {
  SlashCommandBuilder,
  ContainerBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getAbsolutePath } = require("../../../util/module/getAndSaveData");
const { discordStaff } = require("../../../util/module/discordLink");
const proxyCommande = require("../../../util/proxy/proxyCommande");
const fs = require("node:fs");

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
      const { servers } = await discordStaff(
        interaction.user.id,
        serveur,
        "super_moderateur",
      );

      const imagePath = getAbsolutePath(`data/${serveur}/sanctions-chat.png`);
      const imageExists = fs.existsSync(imagePath);

      const container = new ContainerBuilder()
        .setAccentColor(config.couleur[serveur])
        .addTextDisplayComponents((t) =>
          t.setContent("## 💢 Tableau des Sanctions - Tchat"),
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
                .setCustomId("sanctions-chat")
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
              .setCustomId("sanctions-chat")
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

      if (interaction.isMessageComponent()) {
        return interaction.update({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      } else {
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }
    }
  },
};
