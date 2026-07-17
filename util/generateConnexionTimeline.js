const { createCanvas } = require("canvas");
const ActiviteDiscord = require("../util/database/models/ActiviteDiscord");
const config = require("../config");

const DAY_LABELS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

const PADDING = 28;
const DAY_COL_WIDTH = 190;
const HOUR_COL_WIDTH = 46;
const GRID_WIDTH = HOUR_COL_WIDTH * 24;
const CANVAS_WIDTH = PADDING * 2 + DAY_COL_WIDTH + GRID_WIDTH;

const TITLE_HEIGHT = 32;
const SUBTITLE_HEIGHT = 20;
const HEADER_GAP = 16;
const TABLE_HEADER_HEIGHT = 38;
const ROW_HEIGHT = 68;
const BOTTOM_PADDING = 22;

const CANVAS_HEIGHT =
  PADDING +
  TITLE_HEIGHT +
  SUBTITLE_HEIGHT +
  HEADER_GAP +
  TABLE_HEADER_HEIGHT +
  ROW_HEIGHT * 7 +
  BOTTOM_PADDING +
  PADDING;

function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  let result = "";

  if (h > 0) result += `${h} heure${h > 1 ? "s" : ""} `;
  if (m > 0) result += `${m} minute${m > 1 ? "s" : ""} `;
  if (s > 0 || result === "") result += `${s} seconde${s > 1 ? "s" : ""} `;

  return result.trim();
}

function formatDurationShort(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, "0")}`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}min`;
  return "< 1min";
}

function getMonday(date = new Date(), offset = 0) {
  const d = new Date(date);
  d.setDate(d.getDate() + offset * 7);

  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);

  return d;
}

function getDayIndex(date, monday) {
  return Math.floor((date - monday) / 86400000);
}

async function getSessionsWeek(serveur, pseudo, semaineOffset = 0) {
  const monday = getMonday(new Date(), semaineOffset);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 7);

  const [data] = await ActiviteDiscord.aggregate([
    { $match: { serveur, pseudo } },
    {
      $project: {
        session: {
          $filter: {
            input: "$session",
            as: "s",
            cond: {
              $and: [
                { $lt: ["$$s.start", sunday] },
                {
                  $or: [
                    { $eq: ["$$s.end", null] },
                    { $gt: ["$$s.end", monday] },
                  ],
                },
              ],
            },
          },
        },
      },
    },
  ]);

  const days = Array.from({ length: 7 }, () => []);
  if (!data) return { days, monday, sunday };

  for (const session of data.session) {
    const start = new Date(session.start);
    const end = session.end ? new Date(session.end) : new Date();

    if (end < monday || start > sunday) continue;

    let cursor = new Date(start);

    while (cursor < end) {
      const dayStart = new Date(cursor);
      dayStart.setHours(0, 0, 0, 0);

      const nextDay = new Date(dayStart);
      nextDay.setDate(nextDay.getDate() + 1);

      const segmentEnd = end < nextDay ? end : nextDay;
      const index = getDayIndex(dayStart, monday);

      if (index >= 0 && index < 7) {
        days[index].push({ start: cursor, end: segmentEnd, dayStart });
      }

      cursor = nextDay;
    }
  }

  return { days, monday, sunday };
}

function hourInDay(date, dayStart) {
  return (date - dayStart) / 3600000;
}

function shadeColor(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const clamp = (v) => Math.max(0, Math.min(255, v));

  const r = clamp((num >> 16) + Math.round(255 * percent));
  const g = clamp(((num >> 8) & 0x00ff) + Math.round(255 * percent));
  const b = clamp((num & 0x0000ff) + Math.round(255 * percent));

  return `rgb(${r}, ${g}, ${b})`;
}

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

async function generateConnexionTimeline(serveur, pseudo, semaineOffset = 0) {
  const { days, monday, sunday } = await getSessionsWeek(
    serveur,
    pseudo,
    semaineOffset,
  );

  const colorValue = config.serveur?.[serveur]?.couleur;
  const accent = colorValue
    ? `#${colorValue.toString(16).padStart(6, "0")}`
    : "#5865F2";
  const accentLight = shadeColor(accent, 0.18);
  const accentDark = shadeColor(accent, -0.15);

  const isCurrentWeek = semaineOffset === 0;
  const lastDay = new Date(sunday.getTime() - 1);
  const dateRange = `${monday.toLocaleDateString("fr-FR")} - ${lastDay.toLocaleDateString("fr-FR")}`;

  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext("2d");

  roundRectPath(ctx, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 18);
  const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bgGradient.addColorStop(0, "#0d1420");
  bgGradient.addColorStop(1, "#0a0f18");
  ctx.fillStyle = bgGradient;
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 1;
  roundRectPath(ctx, 0.5, 0.5, CANVAS_WIDTH - 1, CANVAS_HEIGHT - 1, 18);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(`Historique de connexion - ${pseudo}`, PADDING, PADDING);

  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.font = "15px sans-serif";
  ctx.fillText(
    `Serveur ${config.serveur[serveur].nom} · ${dateRange}`,
    PADDING,
    PADDING + TITLE_HEIGHT,
  );

  const gridTop = PADDING + TITLE_HEIGHT + SUBTITLE_HEIGHT + HEADER_GAP;
  const gridLeft = PADDING + DAY_COL_WIDTH;
  const gridBottom = gridTop + TABLE_HEADER_HEIGHT + ROW_HEIGHT * 7;

  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "bold 14px sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("Jour", PADDING, gridTop + TABLE_HEADER_HEIGHT / 2);

  ctx.font = "bold 12px sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.textAlign = "center";
  for (let h = 0; h < 24; h++) {
    const x = gridLeft + h * HOUR_COL_WIDTH + HOUR_COL_WIDTH / 2;
    ctx.fillText(
      `${String(h).padStart(2, "0")}h`,
      x,
      gridTop + TABLE_HEADER_HEIGHT / 2,
    );
  }
  ctx.textAlign = "left";

  const rowsTop = gridTop + TABLE_HEADER_HEIGHT;

  days.forEach((sessions, dayIndex) => {
    const rowY = rowsTop + dayIndex * ROW_HEIGHT;
    const isWeekend = dayIndex >= 5;

    if (dayIndex % 2 === 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
      ctx.fillRect(PADDING, rowY, CANVAS_WIDTH - PADDING * 2, ROW_HEIGHT);
    }

    if (isWeekend) {
      ctx.fillStyle = "rgba(120, 140, 255, 0.035)";
      ctx.fillRect(PADDING, rowY, CANVAS_WIDTH - PADDING * 2, ROW_HEIGHT);
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING, rowY);
    ctx.lineTo(CANVAS_WIDTH - PADDING, rowY);
    ctx.stroke();
  });

  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.beginPath();
  ctx.moveTo(PADDING, gridBottom);
  ctx.lineTo(CANVAS_WIDTH - PADDING, gridBottom);
  ctx.stroke();

  for (let h = 0; h <= 24; h++) {
    const x = gridLeft + h * HOUR_COL_WIDTH;
    const isMajor = h % 6 === 0;
    ctx.strokeStyle = isMajor
      ? "rgba(255, 255, 255, 0.09)"
      : "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, rowsTop);
    ctx.lineTo(x, gridBottom);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.beginPath();
  ctx.moveTo(gridLeft, gridTop);
  ctx.lineTo(gridLeft, gridBottom);
  ctx.stroke();

  days.forEach((sessions, dayIndex) => {
    const rowY = rowsTop + dayIndex * ROW_HEIGHT;
    const rowCenter = rowY + ROW_HEIGHT / 2;

    const dayDate = new Date(monday);
    dayDate.setDate(dayDate.getDate() + dayIndex);
    const dayLabel = new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    }).format(dayDate);

    const totalSec = sessions.reduce(
      (acc, s) => acc + Math.floor((s.end - s.start) / 1000),
      0,
    );

    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText(dayLabel, PADDING, rowCenter - 9);

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "12px sans-serif";
    const summary =
      sessions.length === 0
        ? "Aucune connexion"
        : `${sessions.length} session${sessions.length > 1 ? "s" : ""} · ${formatDurationShort(totalSec)}`;
    ctx.fillText(summary, PADDING, rowCenter + 10);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gridLeft, rowCenter);
    ctx.lineTo(gridLeft + GRID_WIDTH, rowCenter);
    ctx.stroke();

    const barHeight = 14;
    for (const session of sessions) {
      const startHour = hourInDay(session.start, session.dayStart);
      const endHour = hourInDay(session.end, session.dayStart);

      const xStart = gridLeft + startHour * HOUR_COL_WIDTH;
      const xEndRaw = gridLeft + endHour * HOUR_COL_WIDTH;
      const xEnd = Math.max(xEndRaw, xStart + 6);

      const barGradient = ctx.createLinearGradient(xStart, 0, xEnd, 0);
      barGradient.addColorStop(0, accentLight);
      barGradient.addColorStop(1, accentDark);

      ctx.save();
      ctx.shadowColor = accent;
      ctx.shadowBlur = 8;
      ctx.fillStyle = barGradient;
      roundRectPath(
        ctx,
        xStart,
        rowCenter - barHeight / 2,
        xEnd - xStart,
        barHeight,
        barHeight / 2,
      );
      ctx.fill();
      ctx.restore();
    }
  });

  if (isCurrentWeek) {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    const x = gridLeft + hour * HOUR_COL_WIDTH;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, rowsTop);
    ctx.lineTo(x, gridBottom);
    ctx.stroke();
    ctx.restore();

    const label = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes(),
    ).padStart(2, "0")}`;
    ctx.font = "bold 11px sans-serif";
    const labelWidth = ctx.measureText(label).width + 12;
    const labelY = gridBottom + 6;

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    roundRectPath(ctx, x - labelWidth / 2, labelY, labelWidth, 16, 8);
    ctx.fill();

    ctx.fillStyle = "#0a0f18";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, labelY + 8);
    ctx.textAlign = "left";
  }

  return canvas.toBuffer("image/png");
}

async function getConnexionResume(serveur, pseudo, semaineOffset = 0) {
  const { days } = await getSessionsWeek(serveur, pseudo, semaineOffset);

  let description = "";
  let total = 0;

  days.forEach((day, index) => {
    const secondes = day.reduce(
      (acc, session) => acc + Math.floor((session.end - session.start) / 1000),
      0,
    );

    total += secondes;
    description += `**${DAY_LABELS[index]} :** ${formatDuration(secondes)}\n`;
  });

  let joursPourMoyenne = 7;
  if (semaineOffset === 0) {
    const today = new Date().getDay();
    joursPourMoyenne = today === 0 ? 7 : today;
  } else if (semaineOffset > 0) {
    joursPourMoyenne = 0;
  }

  const moyenne =
    joursPourMoyenne > 0 ? Math.floor(total / joursPourMoyenne) : 0;

  description += `\n**Moyenne de connexion${
    semaineOffset === 0 ? " (jours écoulés)" : " cette semaine"
  } :** ${joursPourMoyenne > 0 ? formatDuration(moyenne) : "N/A"}`;

  return description;
}

module.exports = {
  generateConnexionTimeline,
  getConnexionResume,
};
