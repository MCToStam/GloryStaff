const {
  ContainerBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");
const config = require("../../config");

async function containerMultiple(serveur, file, configData) {
  const typeMap = {
    attentestaff: "Attente Staff",
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

  let description = "";
  let first = true;

  for (const [system, settings] of Object.entries(configData)) {
    const status = settings.active
      ? "<:actif:1318501209803325491>"
      : "<:inactif:1318501225141895188>";
    description += `${first ? "" : "\n"}**- ${system} : ${status}**`;
    first = false;
  }

  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((t) =>
      t.setContent(`## Configuration - ${typeMap[file] || file}`),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) => t.setContent(description))
    .addSeparatorComponents((s) => s)
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`config_select-${file}`)
          .setPlaceholder("Choisissez un module")
          .addOptions(
            Object.keys(configData).map((system) => ({
              label: system,
              description: `Configurer ${system}`,
              value: `config_select-${file}-${system}`,
            })),
          ),
      ),
    );

  return container;
}

module.exports = { containerMultiple };
