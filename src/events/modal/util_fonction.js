const path = require("path");
const fs = require("fs");

function parseValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;

  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "object" || Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {}

  return value;
}

function getFunctionArgs(fn) {
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

function loadFunction({ file, name, folder }) {
  const basePath = folder
    ? path.join(__dirname, "../../../util", folder, file)
    : path.join(__dirname, "../../../util", file);

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
    const parts = interaction.customId.split(":");

    const file = parts[1];
    const functionName = parts[2];
    const folder = parts[3] || null;

    let fn;
    try {
      fn = loadFunction({ file, name: functionName, folder });
    } catch (err) {
      return interaction.reply({
        content: `❌ ${err.message}`,
        ephemeral: true,
      });
    }

    const args = {};
    for (const field of interaction.fields.fields.values()) {
      args[field.customId] = field.value;
    }
    const argNames = getFunctionArgs(fn);

    const finalArgs = argNames.map((name) => {
      if (name === "client") return client;
      return parseValue(args[name]);
    });

    await interaction.reply({
      content: `✅ Fonction **${functionName}** exécutée avec succès`,
      ephemeral: true,
    });
    fn(...finalArgs);
  },
};
