const {
  ContainerBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  AttachmentBuilder,
} = require("discord.js");
const Evenement = require("../../../../util/database/models/Evenement");

module.exports = {
  data: { name: "evenement_modifiercreateur" },

  async execute(client, interaction, config) {
    const evenementId = interaction.customId.split("-")[1];
    const pseudonymes = interaction.fields.getTextInputValue(
      "evenement_createurs",
    );

    const evenement = await Evenement.findById(evenementId);

    if (!evenement) {
      const erreurContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((t) => t.setContent("## ❌ Erreur"))
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent("Cet événement n'existe plus."),
        );

      return interaction.reply({
        components: [erreurContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const createur = pseudonymes
      .split(",")
      .map((pseudo) => pseudo.trim())
      .filter((pseudo) => pseudo.length > 0);

    evenement.createur = createur;
    await evenement.save();

    const container = new ContainerBuilder()
      .setAccentColor(config.serveur[evenement.serveur].couleur)
      .addTextDisplayComponents((t) =>
        t.setContent(`## ${evenement.emoji ?? "🎉"} ${evenement.nom}`),
      )
      .addSeparatorComponents((s) => s)
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents((t) =>
            t.setContent(`**Nom :** ${evenement.nom}`),
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(`evenement_modifiernom-${evenement._id}`)
              .setLabel("Modifier")
              .setStyle(ButtonStyle.Primary),
          ),
      )
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents((t) =>
            t.setContent(`**Émoji :** ${evenement.emoji || "Aucun émoji"}`),
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(`evenement_modifieremoji-${evenement._id}`)
              .setLabel("Modifier")
              .setStyle(ButtonStyle.Primary),
          ),
      )
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents((t) =>
            t.setContent(
              `**Description :** ${evenement.description || "Aucune description"}`,
            ),
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(`evenement_modifierdescription-${evenement._id}`)
              .setLabel("Modifier")
              .setStyle(ButtonStyle.Primary),
          ),
      )
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents((t) =>
            t.setContent(
              `**Créateur${evenement.createur.length > 1 ? "s" : ""} :** ${evenement.createur.length === 0 ? "Aucun créateur" : evenement.createur.join(", ")}`,
            ),
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(`evenement_modifiercreateur-${evenement._id}`)
              .setLabel("Modifier")
              .setStyle(ButtonStyle.Primary),
          ),
      )
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents((t) =>
            t.setContent(
              `**Image :** ${evenement.image?.data ? "Une image est définie" : "Aucune image"}`,
            ),
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(`evenement_modifierimage-${evenement._id}`)
              .setLabel("Modifier")
              .setStyle(ButtonStyle.Primary),
          ),
      );

    const files = [];

    if (evenement.image?.data) {
      const fileName = `evenement.${evenement.image.extension || "png"}`;

      files.push(
        new AttachmentBuilder(Buffer.from(evenement.image.data, "base64"), {
          name: fileName,
        }),
      );

      container.addMediaGalleryComponents((m) =>
        m.addItems((item) => item.setURL(`attachment://${fileName}`)),
      );
    }

    container
      .addSeparatorComponents((s) => s)
      .addActionRowComponents((row) =>
        row.setComponents(
          new ButtonBuilder()
            .setCustomId("evenement_page-0")
            .setLabel("🚪 Retour à l'Accueil")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`evenement_supprimer-${evenement._id}`)
            .setLabel("🗑️ Supprimer l'Événement")
            .setStyle(ButtonStyle.Danger),
        ),
      );

    return interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
