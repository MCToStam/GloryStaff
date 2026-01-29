const { saveData } = require("../../util/module/getAndSaveData");

const SANCTIONS_URL =
  "https://ngconfigapi-backend-production.up.railway.app/api/toxicity/public/sanctions?environment=prod";
const TIERS_URL =
  "https://ngconfigapi-backend-production.up.railway.app/api/toxicity/public/tiers?environment=prod";
const MALUS_URL =
  "https://ngconfigapi-backend-production.up.railway.app/api/toxicity/public/malus?environment=prod";

async function updateSanctionsCache() {
  const [sanctionsRes, tiersRes, malusRes] = await Promise.all([
    fetch(SANCTIONS_URL),
    fetch(TIERS_URL),
    fetch(MALUS_URL),
  ]);

  if (!sanctionsRes.ok || !tiersRes.ok || !malusRes.ok) {
    throw new Error("Erreur lors des requêtes Sanctions");
  }

  const sanctionsData = await sanctionsRes.json();
  const tiersData = await tiersRes.json();
  const malusData = await malusRes.json();

  if (
    sanctionsData.status !== "success" ||
    tiersData.status !== "success" ||
    malusData.status !== "success"
  ) {
    throw new Error("Données Sanctions invalides");
  }

  const data = {
    sanctions: sanctionsData.sanctions,
    tiers: tiersData.tiers,
    malus: malusData.malus,
  };

  saveData("data/sanctionsCache.json", data);
}

module.exports = { updateSanctionsCache };
