const { saveData } = require("../../util/module/getAndSaveData");
const log = require("../../util/module/log.js");
const config = require("../../config");

async function cacheApiGloryBot() {
  try {
    log("📥 Récupération des données depuis l'API...", "LOG", "gray");

    const [getNgResponse, allStaffResponse] = await Promise.all([
      fetch(`${config.glorybot_url}/api/get-ng`, {
        headers: { Authorization: `Bearer ${config.glorybot_token}` },
      }),
      fetch(`${config.glorybot_url}/api/allStaff`, {
        headers: { Authorization: `Bearer ${config.glorybot_token}` },
      }),
    ]);

    if (!getNgResponse.ok) throw new Error("❌ Erreur API /api/get-ng");
    if (!allStaffResponse.ok) throw new Error("❌ Erreur API /api/allStaff");

    const [dataNg, dataStaff] = await Promise.all([
      getNgResponse.json(),
      allStaffResponse.json(),
    ]);

    saveData("data/api_get_ng.json", dataNg);
    saveData("data/api_all_staff.json", dataStaff);

    log("📦 Données enregistrées avec succès !", "LOG", "gray");
  } catch (err) {
    console.error("🔥 Erreur lors de la récupération/enregistrement :", err);
  }
}

module.exports = { cacheApiGloryBot };
