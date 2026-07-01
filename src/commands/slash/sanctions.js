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
const {
  getData,
  getAbsolutePath,
} = require("../../../util/module/getAndSaveData");
const { discordStaff } = require("../../../util/module/discordLink");
const proxyCommande = require("../../../util/proxy/proxyCommande");
const fs = require("node:fs");
const {
  buildErrorContainer,
  sendTemporaryError,
  replyOrUpdate,
} = require("../../../util/proxy/reply");

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return "0 minute";

  const days = Math.floor(minutes / 1440); // 60*24
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  const parts = [];

  if (days > 0) parts.push(`${days} jour${days > 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} heure${hours > 1 ? "s" : ""}`);
  if (mins > 0) parts.push(`${mins} minute${mins > 1 ? "s" : ""}`);

  return parts.join(", ").replace(/, ([^,]*)$/, " et $1");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sanctions")
    .setDescription("Affiche les sanctions et les paliers de toxicité")
    .addStringOption((option) =>
      option
        .setName("sanction")
        .setDescription("Sanction à détailler")
        .setRequired(false)
        .setAutocomplete(true),
    ),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur, sanction } = interaction.parametre;

    if (config.liste_serveur_java.includes(serveur) && sanction) {
      const sanctionsData = getData("data/sanctionsCache.json");
      const sanctionData = sanctionsData.sanctions.find(
        (s) => s.technicalName === sanction,
      );

      if (!sanctionData) {
        const errorContainer = buildErrorContainer(
          config,
          "❌ Sanction Introuvable",
          "La sanction demandé n'a pas pu être trouvée.",
        );

        return sendTemporaryError(interaction, errorContainer);
      } else {
        const container = new ContainerBuilder()
          .setAccentColor(config.serveur[serveur].couleur)
          .addTextDisplayComponents((t) =>
            t.setContent(`## 💢 Sanction : ${sanctionData.name}`),
          )
          .addSeparatorComponents((s) => s)
          .addTextDisplayComponents((t) =>
            t.setContent(
              `**Points de Toxicité :** ${sanctionData.toxicityPoints}\n**Enregistré Punisher :** ${sanctionData.punisher ? "Oui" : "Non"}`,
            ),
          )
          .addSeparatorComponents((s) => s)
          .addTextDisplayComponents((t) =>
            t.setContent(
              `**Avertissement Préalable :** ${sanctionData.warning ? "Oui" : "Non"}\n**Temps de Mute :** ${formatDuration(sanctionData.muteTimeMinutes)}\n**Temps de Jail :** ${formatDuration(sanctionData.jailTimeMinutes)}\n**Temps de Ban :** ${formatDuration(sanctionData.tempbanTimeMinutes)}`,
            ),
          )
          .addSeparatorComponents((s) => s)
          .addTextDisplayComponents((t) =>
            t.setContent(
              `**Amende Victime :** ${sanctionData.playerFineDollars.toLocaleString()}$\n**Amende ONU :** ${sanctionData.staffFineDollars.toLocaleString()}$`,
            ),
          );

        await replyOrUpdate(interaction, [container]);
      }
    } else if (config.liste_serveur_java.includes(serveur)) {
      const container = new ContainerBuilder()
        .setAccentColor(config.serveur[serveur].couleur)
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

      await replyOrUpdate(interaction, [container], { files: [attachment] });
    } else {
      const { servers } = await discordStaff(
        interaction.user.id,
        serveur,
        "super_moderateur",
      );

      const imagePath = getAbsolutePath(`data/${serveur}/sanctions-chat.png`);
      const imageExists = fs.existsSync(imagePath);

      const container = new ContainerBuilder()
        .setAccentColor(config.serveur[serveur].couleur)
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

        await replyOrUpdate(interaction, [container], { files: [attachment] });
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

      await replyOrUpdate(interaction, [container]);
    }
  },
};
