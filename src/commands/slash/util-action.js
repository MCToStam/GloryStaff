const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ContainerBuilder,
  SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

function getFunctionArgs(fn) {
  const fnStr = fn
    .toString()
    .replace(/\/\*.*?\*\//gs, "")
    .replace(/\/\/.*$/gm, "");

  const match = fnStr.match(/\(([^)]*)\)/);
  if (!match) return [];

  return match[1]
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean)
    .filter((a) => !["client", "interaction"].includes(a));
}

function scanUtil() {
  const utilPath = path.join(__dirname, "../../../util");
  const entries = fs.readdirSync(utilPath, { withFileTypes: true });

  const actions = [];

  for (const entry of entries.filter((e) => e.isDirectory())) {
    actions.push({
      label: entry.name,
      value: `util_dossier-:${entry.name}`,
      args: null,
      emoji: "📁",
    });
  }

  for (const entry of entries.filter(
    (e) => e.isFile() && e.name.endsWith(".js"),
  )) {
    const filePath = path.join(utilPath, entry.name);

    delete require.cache[require.resolve(filePath)];
    const mod = require(filePath);

    if (typeof mod === "function") {
      const fnName = mod.name && mod.name.length ? mod.name : "default";

      actions.push({
        label: `${entry.name} → ${fnName}`,
        value: `util_fonction-:root:${entry.name}:${fnName}`,
        args: getFunctionArgs(mod),
      });
    } else if (typeof mod === "object" && mod !== null) {
      for (const [name, fn] of Object.entries(mod)) {
        if (typeof fn === "function") {
          actions.push({
            label: `${entry.name} → ${name}`,
            value: `util_fonction-:root:${entry.name}:${name}`,
            args: getFunctionArgs(fn),
          });
        }
      }
    }
  }

  return actions;
}

function buildSelectOptions(actions) {
  return actions.slice(0, 25).map((a) => {
    const option = {
      label: a.label,
      value: a.value,
      emoji: a.emoji,
    };

    if (Array.isArray(a.args)) {
      option.description = a.args.length
        ? `args: ${a.args.join(", ")}`
        : "aucun argument";
    }

    return option;
  });
}

module.exports = {
  serveur: ["743741992194015314", "1132299932418719788"],
  data: new SlashCommandBuilder()
    .setName("util-action")
    .setDescription("Actionner une fonction depuis util"),

  async execute(client, interaction, config) {
    if (!config.developpeur.includes(interaction.user.id)) {
      const errorContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent("## ❌ Permission Manquante"),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            `Tu n'as pas la permission d'effectuer cette action.`,
          ),
        );

      if (interaction.isMessageComponent()) {
        const sentMessage = await interaction.update({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
          withResponse: true,
        });

        setTimeout(async () => {
          try {
            if (sentMessage.resource) {
              await sentMessage.resource.message.delete();
            } else {
              await sentMessage.delete();
            }
          } catch (error) {}
        }, 5_000);
        return;
      } else {
        return interaction.reply({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
    }

    const actions = scanUtil();
    const options = buildSelectOptions(actions);

    const container = new ContainerBuilder()
      .setAccentColor(config.colors.normal)
      .addTextDisplayComponents((t) =>
        t.setContent("## 🛠️ Fonctions util détectées"),
      )
      .addSeparatorComponents((s) => s)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("util-action-select")
            .setPlaceholder("Choisissez une fonction")
            .addOptions(options),
        ),
      );

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
