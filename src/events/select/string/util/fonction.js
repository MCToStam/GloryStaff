const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  LabelBuilder,
} = require("discord.js");
const path = require("path");
const fs = require("fs");

function getFunctionParams(fn) {
  const str = fn
    .toString()
    .replace(/\/\*.*?\*\//gs, "")
    .replace(/\/\/.*$/gm, "");

  const match = str.match(/\(([^)]*)\)/);
  if (!match) return [];

  return match[1]
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}

function getUserArgs(fn) {
  return getFunctionParams(fn).filter((a) => a !== "client");
}

function loadFunction({ file, name, folder }) {
  const basePath = folder
    ? path.join(__dirname, "../../../../../util", folder, file)
    : path.join(__dirname, "../../../../../util", file);

  if (!fs.existsSync(basePath)) {
    throw new Error("Fichier util introuvable");
  }

  delete require.cache[require.resolve(basePath)];
  const mod = require(basePath);

  if (typeof mod === "function") {
    if (name === "default" || mod.name === name) {
      return mod;
    }

    throw new Error("Fonction introuvable");
  }

  if (typeof mod === "object" && mod !== null) {
    const fn = mod[name];
    if (typeof fn === "function") {
      return fn;
    }
  }

  throw new Error("Fonction introuvable");
}

module.exports = {
  data: {
    name: "util_fonction",
  },

  async execute(client, interaction) {
    const parts = interaction.values[0].split(":");

    const folder = parts[1];
    const file = parts[2];
    const functionName = parts[3] ?? null;

    let fn;
    try {
      fn = loadFunction({ file, name: functionName, folder });
    } catch (err) {
      return interaction.reply({
        content: `❌ ${err.message}`,
        ephemeral: true,
      });
    }

    const params = getFunctionParams(fn);
    const userArgs = getUserArgs(fn);

    if (!userArgs.length) {
      const callArgs = [];

      if (params.includes("client")) {
        callArgs.push(client);
      }

      await interaction.reply({
        content: `✅ Fonction **${functionName}** exécutée avec succès`,
        ephemeral: true,
      });

      return await fn(...callArgs);
    }

    const modal = new ModalBuilder()
      .setCustomId(`util_fonction-:${file}:${functionName}:${folder ?? ""}`)
      .setTitle(`Arguments – ${functionName}`);

    for (const arg of userArgs.slice(0, 5)) {
      const label = new LabelBuilder()
        .setLabel(arg)
        .setDescription(`Valeur pour l'argument "${arg}"`)
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId(arg)
            .setStyle(TextInputStyle.Short)
            .setRequired(false),
        );

      modal.addLabelComponents(label);
    }

    await interaction.showModal(modal);
  },
};
