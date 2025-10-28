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

    const dayData = getData(`data/${serveur}/tempsdejeu/${dateString}.json`);

    for (const pseudo of staffList) {
      data[pseudo].push(dayData[pseudo] || 0);
    }
  }

  return { dates, data };
}

module.exports = { getTotalConnexionTable };
