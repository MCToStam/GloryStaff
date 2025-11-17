const {
  ContainerBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const config = require("../../config");

async function containerSingle(serveur, systemName, configData, file) {
  const settings = configData[systemName];

  const typeMap = {
    attentestaff: "Attente Staff",
    candidature: "Candidature",
    disband: "Disband",
    doublelead: "Double Lead",
    expansionterritoriale: "Expansion Territoriale",
    forum: "Forum",
    jail: "Jail",
    notation: "Notation",
    onu: "ONU",
    radio: "NGRadio",
    recap: "Récapitulatif",
    routine: "Routine",
    staff: "Staff",
  };

  const status = settings.active
    ? "<:actif:1318501209803325491>"
    : "<:inactif:1318501225141895188>";

  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((t) =>
      t.setContent(`## Configuration - ${typeMap[systemName] || systemName}`),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) => t.setContent(`**Statut :** ${status}`));

  const pendingButtons = [];

  for (const key of Object.keys(settings)) {
    const item = settings[key];

    if (key === "active") continue;
    if (!item || typeof item !== "object" || !item.type) continue;

    switch (item.type) {
      case "channel":
        container
          .addTextDisplayComponents((t) => t.setContent(`\n\n**${key} :**`))
          .addActionRowComponents((row) =>
            row.setComponents(
              new ChannelSelectMenuBuilder()
                .setDisabled(!settings.active)
                .setCustomId(`config_${key}-${file}-${systemName}`)
                .setPlaceholder("Choisit un salon")
                .setChannelTypes(item.salonAutorise || [])
                .setDefaultChannels(item.valeur ? [item.valeur] : []),
            ),
          );
        break;

      case "role":
        container
          .addTextDisplayComponents((t) => t.setContent(`\n\n**${key} :**`))
          .addActionRowComponents((row) =>
            row.setComponents(
              new RoleSelectMenuBuilder()
                .setDisabled(!settings.active)
                .setCustomId(`config_${key}-${file}-${systemName}`)
                .setPlaceholder("Choisit un rôle")
                .setDefaultRoles(item.valeur ? item.valeur : [])
                .setMinValues(0)
                .setMaxValues(25),
            ),
          );
        break;

      case "grade":
        container
          .addTextDisplayComponents((t) => t.setContent(`\n\n**${key} :**`))
          .addActionRowComponents((row) =>
            row.setComponents(
              new StringSelectMenuBuilder()
                .setDisabled(!settings.active)
                .setCustomId(`config_${key}-${file}-${systemName}`)
                .setPlaceholder("Choisit un grade")
                .setOptions(
                  [
                    "Administrateur",
                    "Super-Modérateur",
                    "Modérateur Plus",
                    "Modérateur",
                    "Modérateur Test",
                    "Guide",
                  ].map((g) => ({
                    label: g,
                    value: `config_grade-${g}`,
                    default: item.valeur === g,
                  })),
                ),
            ),
          );
        break;

      case "button":
        pendingButtons.push(
          new ButtonBuilder()
            .setCustomId(item.customId)
            .setLabel(key)
            .setStyle(ButtonStyle[item.style] ?? ButtonStyle.Secondary),
        );
        break;
    }
  }

  if (pendingButtons.length > 0) {
    container.addSeparatorComponents((s) => s);

    for (let i = 0; i < pendingButtons.length; i += 5) {
      container.addActionRowComponents(
        new ActionRowBuilder().addComponents(...pendingButtons.slice(i, i + 5)),
      );
    }
  }

  container
    .addSeparatorComponents((s) => s)
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        ...(Object.keys(configData).length > 1
          ? [
              new ButtonBuilder()
                .setCustomId(`config_retour-${file}`)
                .setLabel("🚪 Retour")
                .setStyle(ButtonStyle.Secondary),
            ]
          : []),
        new ButtonBuilder()
          .setCustomId(`config_toggle-${systemName}-${file}`)
          .setLabel(
            settings.active ? "Désactiver le module" : "Activer le module",
          )
          .setStyle(settings.active ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`informations_supplementaires-${systemName}`)
          .setLabel("❓ Informations Supplémentaires")
          .setStyle(ButtonStyle.Secondary),
      ),
    );

  return container;
}

module.exports = { containerSingle };

/*.setChannelTypes( systemName === "radio" ? [2, 13] : systemName === "Guide" || systemName === "Modérateur" || systemName === "Builder" ? [0, 5, 10, 11, 12, 15] : [0, 5, 10, 11, 12], )*/
