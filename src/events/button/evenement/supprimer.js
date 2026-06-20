const {
  ContainerBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const Evenement = require("../../../../util/database/models/Evenement");

const EVENEMENTS_PAR_PAGE = 5;

module.exports = {
  data: { name: "evenement_supprimer" },

  async execute(client, interaction, config) {
    const evenementId = interaction.customId.split("-")[1];

    const evenement = await Evenement.findById(evenementId).lean();

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

    const serveur = evenement.serveur;

    await Evenement.deleteOne({ _id: evenementId });

    const tousLesEvenements = await Evenement.find({ serveur }).lean();
    const totalPages = Math.max(
      1,
      Math.ceil(tousLesEvenements.length / EVENEMENTS_PAR_PAGE),
    );

    const evenementsPage = tousLesEvenements.slice(0, EVENEMENTS_PAR_PAGE);

    const container = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents((t) =>
            t.setContent("## 🎉 Gestion des Événements"),
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(`evenement_creer-${serveur}`)
              .setLabel("➕ Créer un Événement")
              .setStyle(ButtonStyle.Success),
          ),
      )
      .addSeparatorComponents((s) => s);

    if (evenementsPage.length === 0) {
      container
        .addTextDisplayComponents((t) =>
          t.setContent("Aucun événement n'a été créé sur ce serveur."),
        )
        .addSeparatorComponents((s) => s);
    }

    for (const evt of evenementsPage) {
      container
        .addSectionComponents((section) =>
          section
            .addTextDisplayComponents((t) =>
              t.setContent(`**${evt.emoji ?? "🎉"} ${evt.nom}**`),
            )
            .setButtonAccessory((button) =>
              button
                .setCustomId(`evenement_modifier-${evt._id}`)
                .setLabel("✏️ Modifier l'Événement")
                .setStyle(ButtonStyle.Primary),
            ),
        )
        .addSeparatorComponents((s) => s);
    }

    container.addActionRowComponents((row) =>
      row.setComponents(
        new ButtonBuilder()
          .setCustomId(`evenement_page--1`)
          .setLabel("◀️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("evenement_page_label")
          .setLabel(`Page 1/${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`evenement_page-1`)
          .setLabel("▶️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(totalPages <= 1),
      ),
    );

    return interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
