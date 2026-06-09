const {
  ContainerBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");
const config = require("../../config");
const { discordStaff } = require("../../util/module/discordLink");
const CONFIG_STATIC = require("../../util/config");

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

async function allConfig(serveur, userId) {
  let description = "";
  const options = [];
  const permissionCache = {};

  for (const systeme of CONFIG_STATIC) {
    if (systeme.permission) {
      if (!permissionCache[systeme.permission]) {
        const { servers } = await discordStaff(
          userId,
          serveur,
          systeme.permission,
        );
        permissionCache[systeme.permission] = servers.includes(serveur);
      }
      if (!permissionCache[systeme.permission]) continue;
    }

    const emoji = parseEmoji(systeme.emoji);

    const data = {
      label: systeme.nom,
      value: `config_subconfig-main-${systeme.nom}`,
      description: `${Object.keys(systeme.systeme).length} module${Object.keys(systeme.systeme).length > 1 ? "s" : ""}`,
      ...(emoji ? { emoji } : {}),
    };

    options.push(data);

    description =
      description +
      (description !== "" ? "\n" : "") +
      (systeme.emoji || "-") +
      " " +
      systeme.nom;
  }

  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `## ${config.serveur[serveur].emoji_formate} Configuration GloryStaff`,
      ),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) => t.setContent(description))
    .addSeparatorComponents((s) => s)
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("config_subconfig")
          .setPlaceholder("Sélectionnez un système")
          .addOptions(options),
      ),
    );

  return container;
}

module.exports = allConfig;
