const log = require("../../util/module/log");
const config = require("../../config");
const Configuration = require("../../util/database/models/Configuration");

function rotateArray(arr, shift = 1) {
  if (!arr.length) return arr;

  const realShift = shift % arr.length;
  return [...arr.slice(-realShift), ...arr.slice(0, -realShift)];
}

async function decalage_notations(typeRotation) {
  for (const serveur of config.liste_serveur) {
    if (serveur !== "blue") continue;
    try {
      const staffData = require("../../util/module/getAndSaveData").getData(
        `data/${serveur}/staff-serveur.json`,
      );

      const currentStaffList = [
        ...(staffData["Administrateur"] || []),
        ...(staffData["Super-Modérateur"] || []),
      ];

      const configs = await Configuration.find({
        serveur,
        categorie: "Notations",
        systeme: "Répartition",
      });

      for (const repartitionConfig of configs) {
        if (!repartitionConfig.active) continue;

        const decalageConfig = repartitionConfig.data.get(
          "Décalage des Notations",
        );
        if (!decalageConfig) continue;

        const guildId = repartitionConfig.guildId;

        const mode = decalageConfig;
        if (!mode || mode === "jamais") continue;
        if (mode !== typeRotation) continue;

        const currentRepartition = repartitionConfig.data.get("donnee");
        if (!currentRepartition || !Object.keys(currentRepartition).length)
          continue;

        let orderedStaffs = Object.keys(currentRepartition);

        orderedStaffs = orderedStaffs.filter((staff) =>
          currentStaffList.includes(staff),
        );

        const newStaffs = currentStaffList.filter(
          (staff) => !orderedStaffs.includes(staff),
        );

        orderedStaffs.push(...newStaffs);

        orderedStaffs = rotateArray(orderedStaffs, 1);

        const allRanges = Object.values(currentRepartition);

        const totalNumbers = allRanges.reduce((acc, range) => {
          const [, end] = range.split(" à ").map(Number);
          return Math.max(acc, end);
        }, 0);

        const base = Math.floor(totalNumbers / orderedStaffs.length);
        const remainder = totalNumbers % orderedStaffs.length;

        let pointer = 1;
        const newRepartition = {};

        orderedStaffs.forEach((staff, index) => {
          const size = base + (index < remainder ? 1 : 0);
          const start = pointer;
          const end = pointer + size - 1;

          newRepartition[staff] = `${start} à ${end}`;
          pointer = end + 1;
        });

        repartitionConfig.data.set("donnee", newRepartition);
        await repartitionConfig.save();

        log(
          `✅ Rotation des notations effectuée | ${serveur} | ${guildId} | mode=${mode}`,
          "LOG",
          "gray",
        );
      }
    } catch (err) {
      console.error(`❌ Erreur rotation des notations | ${serveur}`, err);
    }
  }
}

module.exports = {
  decalage_notations,
};
