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

async function containerSingle(serveur, systemName, settings, file) {
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

  if ("Salon" in settings) {
    container
      .addTextDisplayComponents((t) => t.setContent("\n\n**Salon :**"))
      .addActionRowComponents((row) =>
        row.setComponents(
          new ChannelSelectMenuBuilder()
            .setDisabled(!settings.active)
            .setCustomId(`config_salon-${file}-${systemName}`)
            .setPlaceholder("Choisit un salon")
            .setChannelTypes(
              systemName === "radio"
                ? [2, 13]
                : systemName === "Guide" || systemName === "Modérateur" || systemName === "Builder"
                  ? [0, 5, 10, 11, 12, 15]
                  : [0, 5, 10, 11, 12],
            )
            .setDefaultChannels(settings.Salon ? [settings.Salon] : []),
        ),
      );
  }

  if ("Role" in settings) {
    container
      .addTextDisplayComponents((t) => t.setContent("\n**Rôle :**"))
      .addActionRowComponents((row) =>
        row.setComponents(
          new RoleSelectMenuBuilder()
            .setDisabled(!settings.active)
            .setCustomId(`config_role-${file}-${systemName}`)
            .setPlaceholder("Choisit un rôle")
            .setDefaultRoles(settings.Role || [])
            .setMinValues(0)
            .setMaxValues(25),
        ),
      );
  }

  if ("Grade" in settings) {
    container
      .addTextDisplayComponents((t) => t.setContent("\n\n**Grade :**"))
      .addActionRowComponents((row) =>
        row.setComponents(
          new StringSelectMenuBuilder()
            .setDisabled(!settings.active)
            .setCustomId(`config_grade-${file}-${systemName}`)
            .setPlaceholder("Choisit un grade")
            .setOptions([
              {
                label: "Administrateur",
                value: "config_grade-Administrateur",
                default: settings.Grade === "Administrateur",
              },
              {
                label: "Super-Modérateur",
                value: "config_grade-Super-Modérateur",
                default: settings.Grade === "Super-Modérateur",
              },
              {
                label: "Modérateur Plus",
                value: "config_grade-Modérateur Plus",
                default: settings.Grade === "Modérateur Plus",
              },
              {
                label: "Modérateur",
                value: "config_grade-Modérateur",
                default: settings.Grade === "Modérateur",
              },
              {
                label: "Modérateur Test",
                value: "config_grade-Modérateur Test",
                default: settings.Grade === "Modérateur Test",
              },
              {
                label: "Guide",
                value: "config_grade-Guide",
                default: settings.Grade === "Guide",
              },
            ]),
        ),
      );
  }

  if (systemName === "répartition") {
    container
      .addSeparatorComponents((s) => s)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("notation_module-automatique")
            .setLabel("Mélanger aléatoirement")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("notation_module-manual")
            .setLabel("Définir manuellement")
            .setStyle(ButtonStyle.Primary),
        ),
      );
  }

  container
    .addSeparatorComponents((s) => s)
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`config_toggle-${systemName}-${file}`)
          .setLabel(
            settings.active ? "Désactiver le module" : "Activer le module",
          )
          .setStyle(settings.active ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`informations_supplementaires-${systemName}`)
          .setLabel("Informations Supplémentaires")
          .setStyle(ButtonStyle.Secondary),
      ),
    );

  return container;
}

module.exports = { containerSingle };
