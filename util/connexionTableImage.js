const { createCanvas, registerFont } = require("canvas");
const path = require("path");
const config = require("../config");

registerFont(path.join(__dirname, "./fonts/JetBrainsMono-Regular.ttf"), {
  family: "JetBrainsMono",
});

function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h${m < 10 ? "0" + m : m}`;
}

function generateTableImage(dates, data, staffRaw) {
  const staffList = Object.keys(staffRaw).reduce((acc, grade) => {
    const members = staffRaw[grade];

    if (!Array.isArray(members)) return acc;

    members.forEach((pseudo) => {
      if (pseudo && typeof pseudo === "string" && pseudo.trim() !== "") {
        acc[pseudo] = grade;
      }
    });

    return acc;
  }, {});

  const cellWidth = 90;
  const rowHeight = 30;
  const padding = 20;

  const tempCanvas = createCanvas(1, 1);
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.font = "16px JetBrainsMono";
  const longestPseudo = Math.max(
    ...Object.keys(data).map((p) => tempCtx.measureText(p).width),
  );
  const pseudoColumnWidth = Math.ceil(longestPseudo + 20);

  const formattedDates = dates.map((d) => {
    const [day, month] = d.split("-");
    return `${day}/${month}`;
  });

  const canvasWidth =
    padding * 2 + pseudoColumnWidth + dates.length * cellWidth;
  const canvasHeight = padding * 2 + (Object.keys(data).length + 1) * rowHeight;

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#2b2d31";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  for (let rowIndex = 0; rowIndex < Object.keys(data).length; rowIndex++) {
    const isEven = rowIndex % 2 === 0;
    ctx.fillStyle = isEven ? "#2e2e2e" : "#383838";
    ctx.fillRect(
      padding,
      padding + (rowIndex + 1) * rowHeight,
      canvasWidth - padding * 2,
      rowHeight,
    );
  }

  ctx.font = "16px JetBrainsMono";
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";

  ctx.fillText("Pseudo", padding, padding + rowHeight / 2);
  formattedDates.forEach((date, i) => {
    ctx.fillText(
      date,
      padding + pseudoColumnWidth + i * cellWidth,
      padding + rowHeight / 2,
    );
  });

  let rowIndex = 1;
  for (const pseudo in data) {
    const grade = staffList[pseudo];
    const gradeColor =
      grade && config.grade[grade] ? config.grade[grade] : "#ffffff";
    ctx.fillStyle = gradeColor;
    ctx.fillText(
      pseudo,
      padding,
      padding + rowIndex * rowHeight + rowHeight / 2,
    );
    data[pseudo].forEach((sec, i) => {
      const txt = formatDuration(sec);
      ctx.fillText(
        txt,
        padding + pseudoColumnWidth + i * cellWidth,
        padding + rowIndex * rowHeight + rowHeight / 2,
      );
    });
    rowIndex++;
  }

  return canvas.toBuffer("image/png");
}

module.exports = { generateTableImage };
