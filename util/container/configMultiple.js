const {
  ContainerBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");
const config = require("../../config");

async function containerMultiple(guildId, serveur, type, configData) {
  let description = "";
  let first = true;

  for (const [system, settings] of Object.entries(configData.systeme)) {
    const status = settings.active[guildId]
      ? "<:actif:1318501209803325491>"
      : "<:inactif:1318501225141895188>";
    description += `${first ? "" : "\n"}**${settings.emoji || "-"} ${system} : ${status}**`;
    first = false;
  }

  const options = Object.keys(configData.systeme).map((system) => {
    const emojiRaw = configData.systeme[system].emoji;
    let emoji;

    if (emojiRaw) {
      const match = emojiRaw.match(/^<(a?):(\w+):(\d+)>$/);
      if (match) {
        emoji = {
          animated: Boolean(match[1]),
          name: match[2],
          id: match[3],
        };
      }
    }

    return {
      label: system,
      description: `Configurer ${system}`,
      value: `config_subconfig-second-${type}-${system}`,
      ...(emoji && { emoji }),
    };
  });

  options.push({
    label: "Accueil",
    description: "Revenir au menu de configuration",
    value: "config_subconfig-home",
    emoji: "🚪",
  });

  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((t) =>
      t.setContent(
        `## ${configData.emoji ? `${configData.emoji} ` : ""}Configuration - ${
          configData.nom
        }`,
      ),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) => t.setContent(description))
    .addSeparatorComponents((s) => s)
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`config_subconfig-${type}`)
          .setPlaceholder("Choisissez un module")
          .addOptions(options),
      ),
    );

  return container;
}

module.exports = { containerMultiple };
