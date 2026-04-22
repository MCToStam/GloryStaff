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
    name: "absence_menu",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);
    const [, userId, id] = interaction.customId.split("-");
    console.log(userId, id);

    const pseudo = await discordLink(userId);
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
      .setAccentColor(config.couleur[serveur])
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

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
