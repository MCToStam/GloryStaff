const fs = require("fs");
const path = require("path");

const BASE_DIR = path.join(__dirname, "data");

const SALON_AUTORISE = {
  radio: [2, 13],
  Guide: [0, 5, 10, 11, 12, 15],
  Modérateur: [0, 5, 10, 11, 12, 15],
  Builder: [0, 5, 10, 11, 12, 15],
  default: [0, 5, 10, 11, 12],
};

function normalizeModule(moduleName, moduleData) {
  const result = { active: !!moduleData.active };

  for (const key of Object.keys(moduleData)) {
    if (key === "active") continue;

    const value = moduleData[key];

    if (key.toLowerCase() === "salon") {
      const autorise = SALON_AUTORISE[moduleName] || SALON_AUTORISE.default;

      result[key] = {
        type: "channel",
        salonAutorise: autorise,
        valeur: typeof value === "string" ? value : false,
      };
    } else if (key.toLowerCase() === "role") {
      result[key] = {
        type: "role",
        valeur: Array.isArray(value) ? value : false,
      };
    } else if (key.toLowerCase() === "grade") {
      result[key] = {
        type: "grade",
        valeur: value,
      };
    } else {
      result[key] = moduleData[key];
    }
  }

  return result;
}

function normalizeConfigFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  let json;

  try {
    json = JSON.parse(raw);
  } catch (err) {
    console.error("❌ JSON invalide :", filePath);
    return;
  }

  const output = {};

  for (const moduleName of Object.keys(json)) {
    output[moduleName] = normalizeModule(moduleName, json[moduleName]);
  }

  fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
  console.log("✔ Normalisé :", filePath);
}

function scanAndNormalize() {
  const folders = fs.readdirSync(BASE_DIR);

  for (const folder of folders) {
    const folderPath = path.join(BASE_DIR, folder);

    if (!fs.lstatSync(folderPath).isDirectory()) continue;

    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      if (file.startsWith("config-") && file.endsWith(".json")) {
        normalizeConfigFile(path.join(folderPath, file));
      }
    }
  }

  console.log("\n🎉 Normalisation terminée !");
}

scanAndNormalize();
