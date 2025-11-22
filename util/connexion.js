const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const config = require("../config");

async function generateConnexionGraph(serveur, tempsJeu, semaineOffset) {
  const now = new Date();
  const jours = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
  ];

  now.setDate(now.getDate() + semaineOffset * 7);
  const currentDay = now.getDay();
  const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;

  const labels = [];
  const values = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + diffToMonday + i);

    const day = ("0" + date.getDate()).slice(-2);
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    const dateString = `${day}-${month}-${year}`;

    labels.push(jours[i]);
    values.push(tempsJeu[dateString] || 0);
  }

  const buffer = await generateGraphImage(serveur, labels, values);

  return buffer;
}

const width = 800;
const height = 400;

const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width,
  height,
  backgroundColour: "rgb(43, 45, 49)",
});

async function generateGraphImage(serveur, labels, data) {
  const valeur = config.couleur[serveur];
  const color = valeur
    ? `#${valeur.toString(16).padStart(6, "0").toUpperCase()}`
    : "#36A2EB";

  const gradient = (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, `${color}55`);
    gradient.addColorStop(1, `${color}00`);
    return gradient;
  };

  const configuration = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Salaires",
          data,
          borderColor: color,
          backgroundColor: (context) => gradient(context.chart.ctx),
          fill: true,
          tension: 0.45,
          pointBackgroundColor: color,
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointHoverRadius: 6,
          pointRadius: 4,
          borderWidth: 3,
        },
      ],
    },
    options: {
      layout: {
        padding: 25,
      },
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#000000CC",
          borderColor: color,
          borderWidth: 1,
          titleFont: { size: 14, weight: "bold" },
          bodyFont: { size: 13 },
          padding: 10,
          callbacks: {
            label: (tooltipItem) =>
              `${tooltipItem.dataset.label}: ${tooltipItem.raw.toLocaleString("fr-FR")} €`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#FFFFFFCC",
            font: { size: 12 },
          },
          grid: {
            color: "#FFFFFF10",
          },
        },
        y: {
          ticks: {
            display: true,
            color: "#FFFFFF99",
            font: { size: 11 },
            callback: (val) => val.toLocaleString("fr-FR"),
          },
          grid: {
            color: "#FFFFFF08",
          },
          beginAtZero: true,
        },
      },
    },
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

module.exports = { generateConnexionGraph };
