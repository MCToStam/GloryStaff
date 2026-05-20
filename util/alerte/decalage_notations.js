const config = require("../../config");
const { getData, saveData } = require("../../util/module/getAndSaveData");

function rotateArray(arr, shift = 1) {
  if (!arr.length) return arr;

  const realShift = shift % arr.length;

  return [...arr.slice(-realShift), ...arr.slice(0, -realShift)];
}

function shouldRotate(mode, now = new Date()) {
  const isMonday = now.getDay() === 1;
  const isFirstDayOfMonth = now.getDate() === 1;

  if (mode === "semaine") {
    return isMonday;
  }

  if (mode === "mois") {
    return isFirstDayOfMonth;
  }

  return false;
}

async function decalage_notations() {
  const now = new Date();

  for (const serveur of config.liste_serveur) {
    try {
      const configNotationPath = `data/${serveur}/config.json`;

      const configGlobale = getData(configNotationPath);

      const configNotation = configGlobale.find((c) => c.nom === "Notations");

      if (!configNotation) continue;

      const repartitionConfig = configNotation.systeme["Répartition"];

      if (!repartitionConfig?.donnee) continue;

      const decalageConfig =
        repartitionConfig["Décalage des Notations"]?.valeur;

      if (!decalageConfig) continue;

      const staffData = getData(`data/${serveur}/staff-serveur.json`);

      const currentStaffList = [
        ...(staffData["Administrateur"] || []),
        ...(staffData["Super-Modérateur"] || []),
      ];

      for (const [guildId, mode] of Object.entries(decalageConfig)) {
        if (!mode || mode === "jamais") continue;

        const currentRepartition = repartitionConfig.donnee[guildId];

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

        repartitionConfig.donnee[guildId] = newRepartition;

        console.log(
          `✅ Rotation des notations effectuée | ${serveur} | ${guildId} | mode=${mode}`,
        );
      }

      saveData(configNotationPath, configGlobale);
    } catch (err) {
      console.error(`❌ Erreur rotation des notations | ${serveur}`, err);
    }
  }
}

module.exports = {
  decalage_notations,
};
