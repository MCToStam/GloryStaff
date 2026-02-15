const { saveData, saveImage } = require("../../util/module/getAndSaveData");
const { createCanvas } = require("canvas");

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

  generateSanctionImages(data.sanctions);
}

function generateSanctionImages(sanctions) {
  const categories = ["chat", "vocal", "game"];

  function formatMinutes(minutes) {
    if (!minutes || minutes === 0) return "-";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }

  function formatMoney(amount) {
    if (!amount || amount === 0) return "-";
    return amount.toLocaleString("fr-FR") + " $";
  }

  for (const category of categories) {
    const filtered = sanctions.filter((s) => s.category === category);
    const rowHeight = 40;
    const padding = 20;

    const isGame = category === "game";

    const headers = isGame
      ? [
          "Sanction",
          "Points Toxicités",
          "Jail",
          "Tempban",
          "Amende ONU",
          "Amende Victime",
        ]
      : ["Sanction", "Points Toxicités", "Mute", "Jail", "Tempban"];

    const rows = filtered.map((s) =>
      isGame
        ? [
            s.name,
            String(s.toxicityPoints),
            formatMinutes(s.jailTimeMinutes),
            formatMinutes(s.tempbanTimeMinutes),
            formatMoney(s.staffFineDollars),
            formatMoney(s.playerFineDollars),
          ]
        : [
            s.name,
            String(s.toxicityPoints),
            formatMinutes(s.muteTimeMinutes),
            formatMinutes(s.jailTimeMinutes),
            formatMinutes(s.tempbanTimeMinutes),
          ],
    );

    const tempCanvas = createCanvas(100, 100);
    const ctx = tempCanvas.getContext("2d");
    ctx.font = "bold 20px Arial";

    const colCount = headers.length;
    const colWidths = new Array(colCount).fill(0);

    for (let i = 0; i < colCount; i++) {
      let max = ctx.measureText(headers[i]).width + padding;
      for (const row of rows) {
        const w = ctx.measureText(row[i]).width + padding;
        if (w > max) max = w;
      }
      colWidths[i] = max;
    }

    const totalWidth = colWidths.reduce((a, b) => a + b, 0) + 100;

    const colX = [];
    let x = 50;
    for (const w of colWidths) {
      colX.push(x);
      x += w;
    }

    const height = 80 + rows.length * rowHeight;
    const canvas = createCanvas(totalWidth, height);
    const ctx2 = canvas.getContext("2d");

    ctx2.fillStyle = "#1e1e2f";
    ctx2.fillRect(0, 0, totalWidth, height);

    ctx2.fillStyle = "#ffffff";
    ctx2.font = "bold 20px Arial";
    for (let i = 0; i < headers.length; i++) {
      ctx2.fillText(headers[i], colX[i], 50);
    }

    ctx2.font = "18px Arial";

    rows.forEach((row, index) => {
      const y = 80 + index * rowHeight;
      ctx2.fillStyle = index % 2 === 0 ? "#2a2a40" : "#242438";
      ctx2.fillRect(40, y - 25, totalWidth - 80, rowHeight);
      ctx2.fillStyle = "#ffffff";
      row.forEach((cell, i) => {
        let text = cell;
        const measured = ctx2.measureText(cell).width;
        if (measured > colWidths[i] - padding) {
          const ratio = (colWidths[i] - padding) / measured;
          const maxChars = Math.floor(cell.length * ratio) - 3;
          if (maxChars > 0) text = cell.slice(0, maxChars) + "...";
        }
        ctx2.fillText(text, colX[i], y);
      });
    });

    const buffer = canvas.toBuffer("image/png");
    saveImage(`data/sanctions-${category}.png`, buffer);
  }
}

module.exports = { updateSanctionsCache };
