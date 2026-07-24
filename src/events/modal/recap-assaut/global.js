const {
  ContainerBuilder,
  TextDisplayBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getServeur } = require("../../../../util/module/getServeur");
const RecapitulatifAssaut = require("../../../../util/database/models/RecapitulatifAssaut");

module.exports = {
  data: {
    name: "recap_assaut",
  },

  async execute(client, interaction, config) {
    const [_, categorie, id] = interaction.customId.split("-");
    const serveur = await getServeur(interaction);

    if (categorie === "staff") {
      const recap = await RecapitulatifAssaut.findOne({ _id: id });

      recap.staff = [];

      for (const field of interaction.fields.fields.values()) {
        recap.staff.push(...field.values);
      }

      await recap.save();

      const container = new ContainerBuilder()
        .setAccentColor(config.serveur[serveur].couleur)
        .addTextDisplayComponents((t) =>
          t.setContent("## 🪖 Récapitulatif Assaut"),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `**<:pays_attaquant:1529051695915732992> Pays Attaquant :** ${recap.paysAttaquant}\n**<:pays_defenseur:1529051696976891904> Pays Défenseur :** ${recap.paysDefenseur}\n**📅 Date de début :** <t:${recap.date / 1000}:F> • <t:${recap.date / 1000}:R>`,
          ),
        )
        .addSeparatorComponents((s) => s)
        .addSectionComponents((section) =>
          section
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent(
                `**Staff${recap.staff.length > 1 ? "s" : ""} ayant surveillé${recap.staff.length > 1 ? "s" : ""} l'assaut :**\n${recap.staff.length === 0 ? "Aucun staff enregistré" : recap.staff.join(", ")}`,
              ),
            )
            .setButtonAccessory((button) =>
              button
                .setCustomId(`recap_assaut-staff-${recap._id}`)
                .setLabel("🚨 Modifier les Staffs")
                .setStyle(ButtonStyle.Primary),
            ),
        )
        .addSeparatorComponents((s) => s)
        .addSectionComponents((section) =>
          section
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent(
                `**Explosion${recap.explosion.length > 1 ? "s" : ""} ayant été causée${recap.explosion.length > 1 ? "s" : ""} durant l'assaut :**${recap.explosion.length === 0 ? "\nAucune explosion enregistrée" : ""}`,
              ),
            )
            .setButtonAccessory((button) =>
              button
                .setCustomId(`recap_assaut-explosion-${recap._id}`)
                .setLabel("💥 Ajouter une Explosion")
                .setStyle(ButtonStyle.Primary),
            ),
        );

      for (const explosion in recap.explosion) {
        container.addSectionComponents((section) =>
          section
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent(
                `**${explosion.type}** aux coordonnées **X=${explosion.x}** et **Z=${explosion.z}**`,
              ),
            )
            .setButtonAccessory((button) =>
              button
                .setCustomId(
                  `recap_assaut_explosion_delete-${explosion.type}-${explosion.y}-${explosion.z}`,
                )
                .setLabel("🗑️ Supprimer l'Explosion")
                .setStyle(ButtonStyle.Danger),
            ),
        );
      }

      container
        .addSeparatorComponents((s) => s)
        .addSectionComponents((section) =>
          section
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent(
                `**Acte${recap.acte_illegal.length > 1 ? "s" : ""} illéga${recap.acte_illegal.length > 1 ? "ux" : "l"} durant l'assaut :**${recap.acte_illegal.length === 0 ? "\nAucun acte illégal enregistré" : ""}`,
              ),
            )
            .setButtonAccessory((button) =>
              button
                .setCustomId(`recap_assaut-acte_illegal-${recap._id}`)
                .setLabel("🧑‍⚖️ Ajouter un Acte Illégal")
                .setStyle(ButtonStyle.Primary),
            ),
        );

      for (const acte_illegal in recap.acte_illegal) {
        container.addSectionComponents((section) =>
          section
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent(`${acte_illegal}`),
            )
            .setButtonAccessory((button) =>
              button
                .setCustomId(`recap_assaut_acte_illegal_delete-${acte_illegal}`)
                .setLabel("🗑️ Supprimer l'Acte Illégal")
                .setStyle(ButtonStyle.Danger),
            ),
        );
      }

      container
        .addSeparatorComponents((s) => s)
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`recap_assaut_envoyer-${recap.id}`)
              .setLabel("📨 Envoyer le Récapitulatif d'Assaut")
              .setStyle(ButtonStyle.Success),
          ),
        );

      interaction.update({ components: [container] });
    }
  },
};
