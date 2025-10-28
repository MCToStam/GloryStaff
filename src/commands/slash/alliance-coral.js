const { getData } = require("../../../util/module/getAndSaveData");
const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("alliance")
    .setDescription("Affiche la configuration des alliances"),

  async execute(client, interaction, config) {
    const serveur = "coral";

    const data = getData(`data/${serveur}/alliance/donnee.json`);

    const staffData = getData(`data/${serveur}/staff.json`);

    const userId = interaction.user.id;
    const isStaff = Object.values(staffData).some((ids) =>
      ids.includes(userId),
    );
    const allianceChef = data.find(
      (a) => Array.isArray(a.chef) && a.chef.includes(userId),
    );

    if (!isStaff && !allianceChef) {
      const erreurContainer = new ContainerBuilder()
        .setAccentColor(config.errorcolor)
        .addTextDisplayComponents((t) => t.setContent(`## ❌ Erreur`))
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent("Tu n'as pas la permission d'éxecuter cette commande."),
        );

      return interaction.reply({
        components: [erreurContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] },
      });
    }

    const container = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## Alliance - ${serveur.charAt(0).toUpperCase() + serveur.slice(1)}`,
        ),
      )
      .addSeparatorComponents((s) => s);

    if (allianceChef) {
      const chefsMention =
        (Array.isArray(allianceChef.chef)
          ? allianceChef.chef
          : [allianceChef.chef]
        )
          .filter(Boolean)
          .map((id) => `<@${id}>`)
          .join(", ") || "Aucun chef";
      container.addTextDisplayComponents((t) =>
        t.setContent(
          `### ${
            allianceChef.nom
          }\n👑 Chef : ${chefsMention}\n**🌍 Pays Fondateur :** ${
            allianceChef.listePaysFondateur.join(", ") || "Aucun pays fondateur"
          }\n**🌍 Pays Membre :** ${
            allianceChef.listePaysMembre.join(", ") || "Aucun pays membre"
          }`,
        ),
      );

      container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`ally_addmember_${allianceChef.nom}`)
            .setLabel("Ajouter un pays")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`ally_remmember_${allianceChef.nom}`)
            .setLabel("Retirer un pays")
            .setStyle(ButtonStyle.Danger),
        ),
      );
    } else {
      for (const alliance of data) {
        const chefsMention =
          (Array.isArray(alliance.chef) ? alliance.chef : [alliance.chef])
            .filter(Boolean)
            .map((id) => `<@${id}>`)
            .join(", ") || "Aucun chef";
        container.addSectionComponents((section) =>
          section
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent(
                `### ${
                  alliance.nom
                }\n👑 Chef : ${chefsMention}\n**🌍 Pays Fondateur :** ${
                  alliance.listePaysFondateur.join(", ") ||
                  "Aucun pays fondateur"
                }\n**🌍 Pays Membre :** ${
                  alliance.listePaysMembre.join(", ") || "Aucun pays membre"
                }`,
              ),
            )
            .setButtonAccessory((button) =>
              button
                .setCustomId(`alliance_edit_${alliance.nom}`)
                .setLabel("Modifier")
                .setStyle(ButtonStyle.Primary),
            ),
        );
      }

      if (!data || data.length === 0) {
        container.addTextDisplayComponents((t) =>
          t.setContent("Aucune alliance n’a encore été créée"),
        );
      }

      container.addSeparatorComponents((s) => s);
      container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("alliance_create")
            .setLabel("Créer une alliance")
            .setStyle(ButtonStyle.Success),
        ),
      );
    }

    return await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  },
};
