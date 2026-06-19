const {
  ContainerBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const { getServeur } = require("../../../../util/module/getServeur");
const Evenement = require("../../../../util/database/models/Evenement");

const EVENEMENTS_PAR_PAGE = 5;

module.exports = {
  data: { name: "evenement_page" },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);
    const page = parseInt(interaction.customId.split("-")[1], 10) || 0;

    const tousLesEvenements = await Evenement.find({ serveur }).lean();
    const totalPages = Math.max(
      1,
      Math.ceil(tousLesEvenements.length / EVENEMENTS_PAR_PAGE),
    );
    const pageActuelle = Math.min(Math.max(page, 0), totalPages - 1);

    const evenementsPage = tousLesEvenements.slice(
      pageActuelle * EVENEMENTS_PAR_PAGE,
      pageActuelle * EVENEMENTS_PAR_PAGE + EVENEMENTS_PAR_PAGE,
    );

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

    for (const evenement of evenementsPage) {
      container
        .addSectionComponents((section) =>
          section
            .addTextDisplayComponents((t) =>
              t.setContent(`**${evenement.emoji ?? "🎉"} ${evenement.nom}**`),
            )
            .setButtonAccessory((button) =>
              button
                .setCustomId(`evenement_modifier-${evenement._id}`)
                .setLabel("✏️ Modifier l'Événement")
                .setStyle(ButtonStyle.Primary),
            ),
        )
        .addSeparatorComponents((s) => s);
    }

    container.addActionRowComponents((row) =>
      row.setComponents(
        new ButtonBuilder()
          .setCustomId(`evenement_page-${pageActuelle - 1}`)
          .setLabel("◀️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pageActuelle === 0),
        new ButtonBuilder()
          .setCustomId("evenement_page_label")
          .setLabel(`Page ${pageActuelle + 1}/${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`evenement_page-${pageActuelle + 1}`)
          .setLabel("▶️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pageActuelle >= totalPages - 1),
      ),
    );

    return interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
