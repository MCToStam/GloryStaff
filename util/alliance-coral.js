const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ContainerBuilder,
} = require("discord.js");
const config = require("../config");

async function showAllianceList(interaction, serveur, data) {
  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((t) =>
      t.setContent(
        `## Alliance - ${serveur.charAt(0).toUpperCase() + serveur.slice(1)}`,
      ),
    )
    .addSeparatorComponents((s) => s);

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
              alliance.listePaysFondateur.join(", ") || "Aucun pays fondateur"
            }\n**🌍 Pays Membre :** ${
              alliance.listePaysMembre.join(", ") || "Aucun pays membre"
            }`,
          ),
        )
        .setButtonAccessory((button) =>
          button
            .setCustomId(`alliance_edit-${alliance.nom}`)
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

  if (interaction.replied || interaction.deferred) {
    return interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  } else {
    return interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  }
}

async function showAlliancePage(
  interaction,
  serveur,
  data,
  allianceNom,
  adminMode = false,
) {
  const alliance = data.find((a) => a.nom === allianceNom);
  if (!alliance) {
    const erreurContainer = new ContainerBuilder()
      .setAccentColor(config.errorcolor)
      .addTextDisplayComponents((t) => t.setContent(`## ❌ Erreur`))
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(`L'alliance "${allianceNom}" n'existe pas.`),
      );

    return interaction.reply({
      components: [erreurContainer],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  }

  const chefsMention =
    (Array.isArray(alliance.chef) ? alliance.chef : [alliance.chef])
      .filter(Boolean)
      .map((id) => `<@${id}>`)
      .join(", ") || "Aucun chef";

  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((t) =>
      t.setContent(
        `## Alliance - ${
          alliance.nom
        }\n👑 Chef : ${chefsMention}\n**🌍 Pays Fondateur :** ${
          alliance.listePaysFondateur.join(", ") || "Aucun pays fondateur"
        }\n**🌍 Pays Membre :** ${
          alliance.listePaysMembre.join(", ") || "Aucun pays membre"
        }`,
      ),
    )
    .addSeparatorComponents((s) => s);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ally_addmember-${alliance.nom}`)
      .setLabel("Ajouter un pays membre")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`ally_remmember-${alliance.nom}`)
      .setLabel("Retirer un pays membre")
      .setStyle(ButtonStyle.Danger),
  );

  container.addActionRowComponents(row);

  if (adminMode) {
    const adminRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`alliance_send-${alliance.nom}`)
        .setLabel("Envoyer l'effectif")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`ally_editchef-${alliance.nom}`)
        .setLabel("Modifier le(s) chef(s)")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`alliance_delete-${alliance.nom}`)
        .setLabel("Supprimer l'alliance")
        .setStyle(ButtonStyle.Danger),
    );

    const adminRow2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ally_addfonda-${alliance.nom}`)
        .setLabel("Ajouter un pays fondateur")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`ally_remfonda-${alliance.nom}`)
        .setLabel("Retirer un pays fondateur")
        .setStyle(ButtonStyle.Danger),
    );

    container.addActionRowComponents(adminRow);
    container.addActionRowComponents(adminRow2);
  }

  if (interaction.replied || interaction.deferred) {
    return interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] },
    });
  } else {
    return interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  }
}

async function updateAllianceMessage(client, alliance, serveur) {
  if (!alliance.channelId || !alliance.messageId) return;
  const channel = await client.channels
    .fetch(alliance.channelId)
    .catch(() => null);
  if (!channel) return;

  const msg = await channel.messages
    .fetch(alliance.messageId)
    .catch(() => null);
  if (!msg) return;

  const chefsMention =
    (Array.isArray(alliance.chef) ? alliance.chef : [alliance.chef])
      .filter(Boolean)
      .map((id) => `<@${id}>`)
      .join(", ") || "Aucun chef";

  const effectifContainer = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((t) =>
      t.setContent(`📜 **Effectif de l’alliance ${alliance.nom}**`),
    )
    .addTextDisplayComponents((t) =>
      t.setContent(`**👑 Chef :** ${chefsMention}`),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `**🌍 Pays Fondateur :** ${
          alliance.listePaysFondateur.join(", ") || "Aucun pays fondateur"
        }\n**🌍 Pays Membre :** ${
          alliance.listePaysMembre.join(", ") || "Aucun pays membre"
        }`,
      ),
    );

  await msg.edit({
    components: [effectifContainer],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  });
}

module.exports = { showAllianceList, showAlliancePage, updateAllianceMessage };
