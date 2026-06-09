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
    name: "absence_add",
  },

  async execute(client, interaction, config) {
    const [, userId, serveur] = interaction.customId.split("-");

    const debutInput = interaction.fields.getTextInputValue("absence_debut");
    const finInput = interaction.fields.getTextInputValue("absence_fin");
    const raison = interaction.fields.getTextInputValue("absence_raison");

    const errorContainer = (msg) =>
      new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((t) => t.setContent("## ❌ Erreur"))
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) => t.setContent(msg));

    const parseDateTime = (input) => {
      if (!input || input.trim() === "") return null;

      const match = input.match(
        /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2})[:h](\d{2}))?$/,
      );

      if (!match) return null;

      const [, d, m, y, h = "00", min = "00"] = match;

      return new Date(`${y}-${m}-${d}T${h}:${min}:00`);
    };

    const debut = parseDateTime(debutInput);
    const fin = parseDateTime(finInput);

    if (!debut || isNaN(debut.getTime())) {
      return interaction.update({
        components: [
          errorContainer(
            "La date de début est invalide, elle doit être au format ``JJ/MM/AAAA HH:MM`` ou ``JJ/MM/AAAA HHhMM``.",
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (finInput && (!fin || isNaN(fin.getTime()))) {
      return interaction.update({
        components: [
          errorContainer(
            "La date de début est invalide, elle doit être au format ``JJ/MM/AAAA HH:MM`` ou ``JJ/MM/AAAA HHhMM``.",
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (fin && fin.getTime() <= debut.getTime()) {
      return interaction.update({
        components: [
          errorContainer(
            "La date de fin doit être supérieur à celle de début.",
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const pseudo = await discordLink(userId);

    const lastAbsence = await Absense.findOne({ serveur })
      .sort({ id: -1 })
      .select("id");

    const newId = lastAbsence ? lastAbsence.id + 1 : 1;

    await Absense.create({
      id: newId,
      staff: pseudo,
      serveur,
      debut,
      fin: fin || null,
      raison: raison || "Non précisée",
    });

    const absences = await Absense.find({
      staff: pseudo,
      serveur,
    }).sort({ debut: -1 });

    const perPage = 7;
    const page = 0;
    const maxPage = Math.max(1, Math.ceil(absences.length / perPage));

    const slice = absences.slice(0, perPage);

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
        const debutTxt = abs.debut
          ? `<t:${Math.floor(abs.debut.getTime() / 1000)}:R>`
          : "Inconnu";

        const finTxt = abs.fin
          ? `<t:${Math.floor(abs.fin.getTime() / 1000)}:R>`
          : "Non définie";

        container
          .addSectionComponents((section) =>
            section
              .addTextDisplayComponents((t) =>
                t.setContent(
                  `📅 Début : ${debutTxt}\n🏁 Fin : ${finTxt}\n📝 Raison : ${abs.raison}`,
                ),
              )
              .setButtonAccessory((btn) =>
                btn
                  .setCustomId(`absence_menu-${userId}-${abs.id}`)
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
