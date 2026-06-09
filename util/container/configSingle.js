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
const Configuration = require("../../util/database/models/Configuration");

async function containerSingle(guildId, serveur, systemName, configData, type) {
  const settings = configData.systeme[systemName];

  const doc = await Configuration.findOne({
    serveur,
    categorie: type,
    systeme: systemName,
    guildId,
  });

  const active = doc?.active ?? false;
  const getData = (key) => doc?.data?.get(key) ?? null;

  const status = active
    ? "<:actif:1318501209803325491>"
    : "<:inactif:1318501225141895188>";

  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `## ${settings.emoji ? `${settings.emoji} ` : ""}Configuration - ${systemName}`,
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
                .setDisabled(!active)
                .setCustomId(`config_salon-${type}-${systemName}-${key}`)
                .setPlaceholder("Choisit un salon")
                .setChannelTypes(item.salonAutorise || [])
                .setMinValues(0)
                .setMaxValues(1)
                .setDefaultChannels(getData(key) ? [getData(key)] : []),
            ),
          );
        break;

      case "role":
        container
          .addTextDisplayComponents((t) => t.setContent(`\n\n**${key} :**`))
          .addActionRowComponents((row) =>
            row.setComponents(
              new RoleSelectMenuBuilder()
                .setDisabled(!active)
                .setCustomId(`config_role-${type}-${systemName}-${key}`)
                .setPlaceholder("Choisit un rôle")
                .setDefaultRoles(getData(key) ?? [])
                .setMinValues(0)
                .setMaxValues(25),
            ),
          );
        break;

      case "grade":
        console.log(
          Object.entries(config.grade)
            .sort((a, b) => a[1].priorite - b[1].priorite)
            .map(([key, grade]) => ({
              label: grade?.nom?.normal,
              value: `config_grade-${key}`,
              default: getData(key) === key,
            })),
        );
        container
          .addTextDisplayComponents((t) => t.setContent(`\n\n**${key} :**`))
          .addActionRowComponents((row) =>
            row.setComponents(
              new StringSelectMenuBuilder()
                .setDisabled(!active)
                .setCustomId(`config_grade-${type}-${systemName}-${key}`)
                .setPlaceholder("Choisit un grade")
                .setOptions(
                  Object.entries(config.grade)
                    .sort((a, b) => a[1].priorite - b[1].priorite)
                    .map(([idGrade, grade]) => ({
                      label: grade?.nom?.normal,
                      value: `config_grade-${idGrade}`,
                      default: getData(key) === idGrade,
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
            .setStyle(ButtonStyle[item.style] ?? ButtonStyle.Secondary)
            .setDisabled(item.disabled === true && !active),
        );
        break;

      case "select":
        container
          .addTextDisplayComponents((t) => t.setContent(`\n\n**${key} :**`))
          .addActionRowComponents((row) =>
            row.setComponents(
              new StringSelectMenuBuilder()
                .setDisabled(!active)
                .setCustomId(`config_select-${type}-${systemName}-${key}`)
                .setPlaceholder("Choisit une option")
                .setOptions(
                  Object.entries(item.valeurPropose).map(
                    ([label, customValue]) => ({
                      label,
                      value: `config_select-${customValue}`,
                      default: getData(key) === customValue,
                    }),
                  ),
                ),
            ),
          );
        break;

      case "modal": {
        let textContent = `\n\n**${key} :**`;
        const modalValeur = getData(key);

        if (item.questions && Array.isArray(item.questions)) {
          item.questions.forEach((q, index) => {
            const reponse = Array.isArray(modalValeur)
              ? (modalValeur[index] ?? null)
              : null;
            textContent += `\n- ${q.texte}\n*${reponse || "Aucune valeur donnée"}*`;
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
                .setDisabled(!active),
            ),
        );
        break;
      }
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
          .setLabel(active ? "Désactiver le module" : "Activer le module")
          .setStyle(active ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(
            `informations_supplementaires-${configData.nom}-${systemName}`,
          )
          .setLabel("❓ Informations Supplémentaires")
          .setStyle(ButtonStyle.Secondary),
      ),
    );

  return container;
}

module.exports = { containerSingle };
