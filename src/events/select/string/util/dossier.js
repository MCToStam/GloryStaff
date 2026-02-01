const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ContainerBuilder,
  ButtonBuilder,
  ButtonStyle,
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

function getFolderFunctions(folder) {
  const utilPath = path.join(__dirname, "../../../../../util", folder);
  const actions = [];

  const files = fs.readdirSync(utilPath, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(utilPath, file.name);

    delete require.cache[require.resolve(filePath)];
    const mod = require(filePath);

    if (typeof mod === "function") {
      const fnName = mod.name && mod.name.length ? mod.name : "default";

      actions.push({
        label: `${file.name} → ${fnName}`,
        value: `util_fonction-:${folder}:${file.name}:${fnName}`,
        args: getFunctionArgs(mod),
      });
    } else if (typeof mod === "object" && mod !== null) {
      for (const [name, fn] of Object.entries(mod)) {
        if (typeof fn === "function") {
          actions.push({
            label: `${file.name} → ${name}`,
            value: `util_fonction-:${folder}:${file.name}:${name}`,
            args: getFunctionArgs(fn),
          });
        }
      }
    }
  }

  return actions;
}

exports.execute = async (client, interaction, config) => {
  const folder = interaction.values[0].split(":")[1];
  const actions = getFolderFunctions(folder);

  if (!actions.length) {
    return interaction.reply({
      content: "❌ Aucune fonction trouvée dans ce dossier",
      flags: MessageFlags.Ephemeral,
    });
  }

  const options = actions.slice(0, 25).map((a) => ({
    label: a.label,
    value: a.value,
    description: a.args.length
      ? `args: ${a.args.join(", ")}`
      : "aucun argument",
  }));

  const container = new ContainerBuilder()
    .setAccentColor(config.colors.statut)
    .addTextDisplayComponents((t) => t.setContent(`## 📁 util/${folder}`))
    .addSeparatorComponents((s) => s)
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("util_fonction")
          .setPlaceholder("Choisissez une fonction")
          .addOptions(options),
      ),
    )
    .addSeparatorComponents((s) => s)
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("🚪 Retour")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("util_retour"),
      ),
    );

  await interaction.update({
    components: [container],
  });
};

exports.data = { name: "util_dossier" };
