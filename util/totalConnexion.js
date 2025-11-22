const { getData } = require("../util/module/getAndSaveData");

function getTotalConnexionTable(serveur, staffList, semaineOffset = 0) {
  const now = new Date();
  now.setDate(now.getDate() + semaineOffset * 7);

  const currentDay = now.getDay();
  const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;

  const dates = [];
  const data = {};

  for (const pseudo of staffList) {
    data[pseudo] = [];
  }

  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + diffToMonday + i);

    const day = ("0" + date.getDate()).slice(-2);
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    const dateString = `${day}-${month}-${year}`;
    dates.push(dateString);

    const dayData =
      getData(`data/${serveur}/tempsdejeu/${dateString}.json`) || {};

    for (const pseudo of staffList) {
      data[pseudo].push(dayData[pseudo] || 0);
    }
  }

  return { dates, data };
}

function formatDateFR(date) {
  const day = ("0" + date.getDate()).slice(-2);
  const month = ("0" + (date.getMonth() + 1)).slice(-2);
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function getWeeklyDateRange(semaineOffset = 0) {
  const now = new Date();
  now.setDate(now.getDate() + semaineOffset * 7);
  const currentDay = now.getDay();
  const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + diffToMonday + i);
    dates.push(formatDateFR(date));
  }
  return dates;
}

function getTotalVocalTable(serveur, staffList, semaineOffset = 0) {
  const dates = getWeeklyDateRange(semaineOffset);
  const data = {};

  for (const pseudo of staffList) data[pseudo] = [];

  for (const pseudo of staffList) {
    const userData = getData(`data/${serveur}/staff/${pseudo}.json`) || {};
    const entries = userData.vocal_time || [];

    for (const dateString of dates) {
      let totalMs = 0;

      const [dd, mm, yyyy] = dateString.split("-");
      const dayStart = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
      const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000 - 1);

      for (const entry of entries) {
        if (!entry.start || !entry.end) continue;

        const start = new Date(entry.start);
        const end = new Date(entry.end);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

        const overlapStart = Math.max(start.getTime(), dayStart.getTime());
        const overlapEnd = Math.min(end.getTime(), dayEnd.getTime());

        if (overlapEnd > overlapStart) {
          totalMs += overlapEnd - overlapStart;
        }
      }

      data[pseudo].push(Math.floor(totalMs / 1000));
    }
  }

  return { dates, data };
}

function getTotalAttenteStaffTable(serveur, staffList, semaineOffset = 0) {
  const dates = getWeeklyDateRange(semaineOffset);
  const data = {};

  for (const pseudo of staffList) data[pseudo] = [];

  for (const dateString of dates) {
    const [day, month, year] = dateString.split("-").map(Number);
    const dayStart = new Date(year, month - 1, day).getTime();
    const dayEnd = new Date(year, month - 1, day + 1).getTime() - 1;

    for (const pseudo of staffList) {
      const playerData = getData(`data/${serveur}/staff/${pseudo}.json`) || {};
      const sessions = playerData.traitement_attentestaff || [];

      const count = sessions.filter(
        (entry) => entry.start >= dayStart && entry.start <= dayEnd,
      ).length;

      data[pseudo].push(count);
    }
  }

  return { dates, data };
}

module.exports = {
  getTotalConnexionTable,
  getTotalVocalTable,
  getTotalAttenteStaffTable,
};
