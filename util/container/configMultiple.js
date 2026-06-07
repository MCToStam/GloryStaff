const {
  ContainerBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");
const config = require("../../config");
const Configuration = require("../../util/database/models/Configuration");

function parseEmoji(emoji) {
  if (!emoji) return null;

  const match = emoji.match(/^<(a?):(\w+):(\d+)>$/);
  if (!match) return null;

  return {
    animated: match[1] === "a",
    name: match[2],
    id: match[3],
  };
}

async function containerMultiple(guildId, serveur, type, configData) {
  const doc = await Configuration.find({
    serveur,
    categorie: type,
    guildId,
  });

  const map = new Map();
  doc.forEach((d) => map.set(d.systeme, d));

  const systems = Object.entries(configData.systeme);

  let descriptionLines = [];

  const options = systems.map(([systemName, settings]) => {
    const db = map.get(systemName);
    const active = db?.active ?? false;

    const status = active
      ? "<:actif:1318501209803325491>"
      : "<:inactif:1318501225141895188>";

    const emoji = parseEmoji(settings.emoji);

    descriptionLines.push(
      `**${settings.emoji || "⚙️"} ${systemName} : ${status}**`,
    );

    return {
      label: systemName,
      description: `Configurer ${systemName}`,
      value: `config_subconfig-second-${type}-${systemName}`,
      ...(emoji ? { emoji } : {}),
    };
  });

  // bouton retour
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
        `## ${configData.emoji ? `${configData.emoji} ` : ""}${configData.nom}`,
      ),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) => t.setContent(descriptionLines.join("\n")))
    .addSeparatorComponents((s) => s)
    .addActionRowComponents((row) =>
      row.setComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`config_subconfig-${type}`)
          .setPlaceholder("Choisissez un module")
          .addOptions(options),
      ),
    );

  return container;
}

module.exports = { containerMultiple };
