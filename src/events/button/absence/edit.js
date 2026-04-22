const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");
const { getServeur } = require("../../../../util/module/getServeur");
const { discordLink } = require("../../../../util/module/discordLink");
const Absense = require("../../../../util/database/models/Absence");

module.exports = {
  data: {
    name: "absence_edit",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);

    const [, field, userId, id] = interaction.customId.split("-");
    const pseudo = await discordLink(userId);

    const absence = await Absense.findOne({
      staff: pseudo,
      serveur,
      id: Number(id),
    });

    if (!absence) {
      return interaction.reply({
        content: "❌ Absence introuvable.",
        ephemeral: true,
      });
    }

    const formatDate = (date) => {
      if (!date) return "";

      const d = String(date.getDate()).padStart(2, "0");
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const y = date.getFullYear();
      const h = String(date.getHours()).padStart(2, "0");
      const min = String(date.getMinutes()).padStart(2, "0");

      return `${d}/${m}/${y} ${h}:${min}`;
    };

    let defaultValue = "";

    if (field === "raison") {
      defaultValue = absence.raison || "";
    } else if (field === "debut") {
      defaultValue = formatDate(absence.debut);
    } else if (field === "fin") {
      defaultValue = formatDate(absence.fin);
    }

    const modal = new ModalBuilder()
      .setCustomId(`absence_edit_modal-${field}-${userId}-${id}`)
      .setTitle(`Modifier ${field}`);

    const input = new TextInputBuilder()
      .setCustomId("value")
      .setLabel(
        field === "raison"
          ? "Nouvelle raison"
          : "Date (JJ/MM/AAAA HH:MM ou HHhMM)",
      )
      .setStyle(
        field === "raison" ? TextInputStyle.Paragraph : TextInputStyle.Short,
      )
      .setRequired(true)
      .setValue(defaultValue);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  },
};
