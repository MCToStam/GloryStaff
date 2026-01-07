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

async function containerSingle(guildId, serveur, systemName, configData, type) {
  const settings = configData.systeme[systemName];

  const status = settings.active[guildId]
    ? "<:actif:1318501209803325491>"
    : "<:inactif:1318501225141895188>";

  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((t) =>
      t.setContent(
        `## ${
          settings.emoji ? `${settings.emoji} ` : ""
        }Configuration - ${systemName}`,
      ),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) => t.setContent(`**Statut :** ${status}`));

  const pendingButtons = [];

  for (const key of Object.keys(settings)) {
    const item = settings[key];

    if (!item || typeof item !== "object" || !item.type) continue;

    switch (item.type) {
      case "channel":
        container
          .addTextDisplayComponents((t) => t.setContent(`\n\n**${key} :**`))
          .addActionRowComponents((row) =>
            row.setComponents(
              new ChannelSelectMenuBuilder()
                .setDisabled(!settings.active[guildId])
                .setCustomId(`config_salon-${type}-${systemName}`)
                .setPlaceholder("Choisit un salon")
                .setChannelTypes(item.salonAutorise || [])
                .setDefaultChannels(
                  item.valeur[guildId] ? [item.valeur[guildId]] : [],
                ),
            ),
          );
        break;

      case "role":
        container
          .addTextDisplayComponents((t) => t.setContent(`\n\n**${key} :**`))
          .addActionRowComponents((row) =>
            row.setComponents(
              new RoleSelectMenuBuilder()
                .setDisabled(!settings.active[guildId])
                .setCustomId(`config_role-${type}-${systemName}`)
                .setPlaceholder("Choisit un rôle")
                .setDefaultRoles(
                  item.valeur[guildId] ? item.valeur[guildId] : [],
                )
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
                .setDisabled(!settings.active[guildId])
                .setCustomId(`config_grade-${type}-${systemName}`)
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
                    default: item.valeur[guildId] === g,
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

      case "select":
        container
          .addTextDisplayComponents((t) => t.setContent(`\n\n**${key} :**`))
          .addActionRowComponents((row) =>
            row.setComponents(
              new StringSelectMenuBuilder()
                .setDisabled(!settings.active[guildId])
                .setCustomId(`config_select-${type}-${systemName}-${key}`)
                .setPlaceholder("Choisit une option")
                .setOptions(
                  Object.entries(item.valeurPropose).map(
                    ([label, customValue]) => ({
                      label,
                      value: `config_select-${customValue}`,
                      default: item.valeur[guildId] === customValue,
                    }),
                  ),
                ),
            ),
          );
        break;

      case "modal":
        let textContent = `\n\n**${key} :**`;

        if (item.questions && Array.isArray(item.questions)) {
          item.questions.forEach((q) => {
            textContent += `\n- ${q.texte}\n*${
              q.valeur[guildId] || "Aucune valeur donnée"
            }*`;
          });
        }

        container.addSectionComponents((section) =>
          section
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent(textContent),
            )
            .setButtonAccessory((button) =>
              button
                .setCustomId(`config_modal-${type}-${systemName}-${key}`)
                .setLabel(item.label)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!settings.active[guildId]),
            ),
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
        new ButtonBuilder()
          .setCustomId(
            `config_retour-${
              Object.keys(configData.systeme).length > 1 ? "back" : "home"
            }-${type}`,
          )
          .setLabel("🚪 Retour")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`config_toggle-${systemName}-${type}`)
          .setLabel(
            settings.active[guildId]
              ? "Désactiver le module"
              : "Activer le module",
          )
          .setStyle(
            settings.active[guildId] ? ButtonStyle.Danger : ButtonStyle.Success,
          ),
        new ButtonBuilder()
          .setCustomId(`informations_supplementaires-${systemName}`)
          .setLabel("❓ Informations Supplémentaires")
          .setStyle(ButtonStyle.Secondary),
      ),
    );

  return container;
}

module.exports = { containerSingle };
