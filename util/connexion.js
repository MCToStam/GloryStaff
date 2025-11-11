const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require("discord.js");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const config = require("../config");

async function generateConnexionEmbed(
  serveur,
  joueur,
  tempsJeu,
  semaineOffset,
) {
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

  let description = "";

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

    const tempsSec = tempsJeu[dateString] || 0;
    const temps = formatDuration(tempsSec);

    description += `**${jours[i]} ${day} ${moisEnTexte(month)} :** ${temps}\n`;
  }

  const total = values.reduce((acc, val) => acc + val, 0);
  const moyenne = values.length > 0 ? total / values.length : 0;
  description += `\n\n**Moyenne de connexion cette semaine :** ${formatDuration(Math.floor(moyenne))}`;

  const embed = new EmbedBuilder()
    .setTitle(`Connexion - ${joueur}`)
    .setDescription(description)
    .setColor(config.couleur[serveur])
    .setFooter({ text: config.footer });

  let attachment = null;
  if (values.some((v) => v > 0)) {
    const buffer = await generateGraphImage(serveur, labels, values);
    attachment = new AttachmentBuilder(buffer, { name: "connexion.png" });
    embed.setImage("attachment://connexion.png");
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`staff_week-${serveur}-${joueur}/${semaineOffset - 1}`)
      .setLabel("⬅️ Semaine précédente")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`staff_week-${serveur}-${joueur}/${semaineOffset + 1}`)
      .setLabel("Semaine suivante ➡️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(semaineOffset >= 0),
  );

  return { embed, row, attachment };
}

function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  let result = "";

  if (h > 0) result += `${h}h `;
  if (m > 0) result += `${m}m `;
  if (s > 0 || result === "") result += `${s}s`;

  return result.trim();
}

function moisEnTexte(num) {
  const noms = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  return noms[parseInt(num, 10) - 1];
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
  const color =
    valeur !== undefined
      ? `#${valeur.toString(16).padStart(6, "0").toUpperCase()}`
      : "#36A2EB";

  const configuration = {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Salaires",
          data: data,
          borderColor: color,
          backgroundColor: `${color}33`,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: color,
          pointRadius: 3,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
          labels: {
            color: "white",
            font: {
              size: 14,
            },
          },
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (tooltipItem) => {
              return `${tooltipItem.dataset.label}: ${tooltipItem.raw.toLocaleString("fr-FR")} €`;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          ticks: {
            color: "white",
          },
        },
        y: {
          display: false,
          ticks: {
            color: "white",
            callback: (val) => val.toLocaleString("fr-FR"),
          },
          beginAtZero: true,
        },
      },
    },
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

module.exports = { generateConnexionEmbed };
