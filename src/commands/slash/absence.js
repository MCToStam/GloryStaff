const {
  SlashCommandBuilder,
  MessageFlags,
  PermissionFlagsBits,
  ContainerBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const proxyCommande = require("../../../util/proxy/proxyCommande");
const { discordLink } = require("../../../util/module/discordLink");
const Absense = require("../../../util/database/models/Absence");

module.exports = {
  config: { permission: "guide" },

  data: new SlashCommandBuilder()
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setName("absence")
    .setDescription("Affiche et gère tes absences"),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },

  async proxy(client, interaction, config) {
    const { serveur } = interaction.parametre;

    const pseudo = await discordLink(interaction.user.id);

    const absences = await Absense.find({
      staff: pseudo,
      serveur: serveur,
    }).sort({ debut: -1 });

    let page = 0;
    const perPage = 7;

    const start = page * perPage;
    const end = start + perPage;
    const maxPage = Math.max(1, Math.ceil(absences.length / perPage));

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
              .setCustomId(`absence_add-${interaction.user.id}`)
              .setLabel("➕ Ajouter une Absence")
              .setStyle(ButtonStyle.Success),
          ),
      )
      .addSeparatorComponents((s) => s);

    if (slice.length === 0) {
      container
        .addTextDisplayComponents((t) =>
          t.setContent("Aucune absence enregistrée."),
        )
        .addSeparatorComponents((s) => s);
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
                  .setCustomId(`absence_menu-${interaction.user.id}-${abs.id}`)
                  .setLabel("Modifier l'Absence")
                  .setStyle(ButtonStyle.Primary),
              ),
          )
          .addSeparatorComponents((s) => s);
      });
    }

    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`absence_page-${interaction.user.id}-${page - 1}`)
          .setLabel("◀️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId(`absence_page_status`)
          .setLabel(`Page ${page + 1}/${maxPage}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId(`absence_page-${interaction.user.id}-${page + 1}`)
          .setLabel("▶️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(end >= absences.length),
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
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }
  },
};
