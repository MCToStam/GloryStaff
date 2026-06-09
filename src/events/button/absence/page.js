const {
  MessageFlags,
  ContainerBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const { getServeur } = require("../../../../util/module/getServeur");
const { discordLink } = require("../../../../util/module/discordLink");
const Absense = require("../../../../util/database/models/Absence");

module.exports = {
  data: {
    name: "absence_page",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);
    const [, userId, pageStr] = interaction.customId.split("-");
    const page = parseInt(pageStr) || 0;

    const pseudo = await discordLink(userId);

    const absences = await Absense.find({
      staff: pseudo,
      serveur: serveur,
    }).sort({ debut: -1 });

    const perPage = 7;
    const start = page * perPage;
    const end = start + perPage;

    const slice = absences.slice(start, end);

    const container = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              `## 📅 Absences - ${pseudo.replace(/_/g, "\\_")}`,
            ),
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(`absence_add-${userId}`)
              .setLabel("➕ Ajouter une Absence")
              .setStyle(ButtonStyle.Success),
          ),
      )
      .addSeparatorComponents((s) => s);

    if (slice.length === 0) {
      container.addTextDisplayComponents((t) =>
        t.setContent("Aucune absence enregistrée."),
      );
    } else {
      slice.forEach((abs, i) => {
        const debut = abs.debut
          ? `<t:${Math.floor(abs.debut.getTime() / 1000)}:R>`
          : "Inconnu";

        const fin = abs.fin
          ? `<t:${Math.floor(abs.fin.getTime() / 1000)}:R>`
          : "Non définie";

        container
          .addSectionComponents((section) =>
            section
              .addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent(
                  `📅 Début : ${debut}\n🏁 Fin : ${fin}\n📝 Raison : ${abs.raison || "Non précisée"}`,
                ),
              )
              .setButtonAccessory((button) =>
                button
                  .setCustomId(`absence_menu-${userId}-${abs.id}`)
                  .setLabel("Modifier l'Absence")
                  .setStyle(ButtonStyle.Primary),
              ),
          )
          .addSeparatorComponents((s) => s);
      });
    }

    const maxPage = Math.max(1, Math.ceil(absences.length / perPage));

    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`absence_page-${userId}-${page - 1}`)
          .setLabel("◀️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page <= 0),
        new ButtonBuilder()
          .setCustomId(`absence_page_status`)
          .setLabel(`Page ${page + 1}/${maxPage}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`absence_page-${userId}-${page + 1}`)
          .setLabel("▶️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page + 1 >= maxPage),
      ),
    );

    return interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
