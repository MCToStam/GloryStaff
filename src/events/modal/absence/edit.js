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
    name: "absence_edit_modal",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);

    const [, field, userId, id] = interaction.customId.split("-");
    const value = interaction.fields.getTextInputValue("value");

    const errorContainer = (msg) =>
      new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((t) => t.setContent("## ❌ Erreur"))
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) => t.setContent(msg));

    const pseudo = await discordLink(userId);

    const absence = await Absense.findOne({
      staff: pseudo,
      serveur,
      id: Number(id),
    });

    if (!absence) {
      return interaction.reply({
        content: "❌ Absence introuvable.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const parseDate = (input) => {
      const match = input.match(
        /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2})[:h](\d{2}))?$/,
      );
      if (!match) return null;

      const [, d, m, y, h = "00", min = "00"] = match;
      return new Date(`${y}-${m}-${d}T${h}:${min}:00`);
    };

    if (field === "raison") {
      absence.raison = value;
    } else {
      const date = parseDate(value);

      if (!date || isNaN(date.getTime())) {
        return interaction.update({
          components: [
            errorContainer(
              "La date est invalide, elle doit être au format ``JJ/MM/AAAA HH:MM`` ou ``JJ/MM/AAAA HHhMM``.",
            ),
          ],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      absence[field] = date;

      if (
        absence.debut &&
        absence.fin &&
        absence.fin.getTime() <= absence.debut.getTime()
      ) {
        return interaction.update({
          components: [
            errorContainer(
              "La date de fin doit être supérieur à celle de début.",
            ),
          ],
          flags: MessageFlags.IsComponentsV2,
        });
      }
    }

    await absence.save();

    const absenceData = await Absense.findOne({
      staff: pseudo,
      serveur: serveur,
      id: Number(id),
    });

    const debut = absenceData.debut
      ? `<t:${Math.floor(absenceData.debut.getTime() / 1000)}:R>`
      : "Inconnu";

    const fin = absenceData.fin
      ? `<t:${Math.floor(absenceData.fin.getTime() / 1000)}:R>`
      : "Non définie";

    const container = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `## 📅 Absences - ${pseudo.replace(/_/g, "\\_")}`,
        ),
      )
      .addSeparatorComponents((s) => s)
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(`📅 Début : ${debut}`),
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(`absence_edit-debut-${userId}-${absenceData.id}`)
              .setLabel("Modifier le Début")
              .setStyle(ButtonStyle.Primary),
          ),
      )
      .addSeparatorComponents((s) => s)
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(`🏁 Fin : ${fin}`),
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(`absence_edit-fin-${userId}-${absenceData.id}`)
              .setLabel("Modifier la Fin")
              .setStyle(ButtonStyle.Primary),
          ),
      )
      .addSeparatorComponents((s) => s)
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              `📝 Raison : ${absenceData.raison || "Non précisée"}`,
            ),
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(`absence_edit-raison-${userId}-${absenceData.id}`)
              .setLabel("Modifier la Raison")
              .setStyle(ButtonStyle.Primary),
          ),
      )
      .addSeparatorComponents((s) => s)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`absence_terminer-${userId}-${absenceData.id}`)
            .setLabel("Terminer l'Absence Maintenant")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`absence_delete-${userId}-${absenceData.id}`)
            .setLabel("Supprimer l'Absence")
            .setStyle(ButtonStyle.Danger),
        ),
      );

    return interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
