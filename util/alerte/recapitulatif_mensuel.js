const config = require("../../config");
const {
  getFiles,
  getData,
  saveData,
} = require("../../util/module/getAndSaveData");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require("discord.js");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

const generateGraphImage = async (dataParSemaine) => {
  const width = 800;
  const height = 400;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height,
    chartCallback: (ChartJS) => {
      ChartJS.register({
        id: "customCanvasBackgroundColor",
        beforeDraw: (chart) => {
          const ctx = chart.canvas.getContext("2d");
          ctx.save();
          ctx.fillStyle = "rgb(43, 45, 49)";
          ctx.fillRect(0, 0, chart.width, chart.height);
          ctx.restore();
        },
      });
    },
  });

  const labels = dataParSemaine.map((entry) => entry.semaine);
  const argentData = dataParSemaine.map((entry) => entry.argentNotation);
  const moyenneConnexionData = dataParSemaine.map(
    (entry) => entry.moyenneConnexion
  );

  const configuration = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Argent des notations ($)",
          data: argentData,
          borderColor: "rgba(255, 206, 86, 1)",
          backgroundColor: "rgba(255, 206, 86, 0.2)",
          yAxisID: "y",
          tension: 0.3,
        },
        {
          label: "Moyenne de connexions",
          data: moyenneConnexionData,
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          yAxisID: "y1",
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: false,
      scales: {
        y: {
          position: "left",
          title: { display: true, text: "Argent ($)" },
        },
        y1: {
          position: "right",
          grid: { drawOnChartArea: false },
          title: { display: true, text: "Connexion moyenne" },
        },
      },
      plugins: {
        title: {
          display: true,
          text: "Évolution hebdomadaire",
          font: { size: 18 },
        },
      },
    },
    plugins: ["customCanvasBackgroundColor"],
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
};

function formatClassement(classement, serveur, key) {
  const classementTrie = [...classement].sort((a, b) => b[key] - a[key]);

  const top3 = classementTrie.slice(0, 3).map((entry, index) => {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";
    const serverName =
      entry.serveur === serveur
        ? `**${entry.serveur.charAt(0).toUpperCase()}${entry.serveur
            .slice(1)
            .toLowerCase()}**`
        : `${entry.serveur.charAt(0).toUpperCase()}${entry.serveur
            .slice(1)
            .toLowerCase()}`;
    const value =
      key === "argentNotation"
        ? `${entry[key].toLocaleString()}$`
        : entry[key].toFixed(0);
    return `${medal} ${serverName} (${value})`;
  });

  const serverEntry = classementTrie.find((entry) => entry.serveur === serveur);
  let serverRank = "";

  if (serverEntry && !classementTrie.slice(0, 3).includes(serverEntry)) {
    const rank = classementTrie.indexOf(serverEntry) + 1;
    serverRank = `#${rank} **${serveur.charAt(0).toUpperCase()}${serveur
      .slice(1)
      .toLowerCase()}** (${
      key === "argentNotation"
        ? serverEntry[key].toLocaleString() + "$"
        : serverEntry[key].toFixed(0)
    })`;
  }

  return serverRank ? [...top3, serverRank].join("\n") : top3.join("\n");
}

const prepareServerRankings = async () => {
  const files = getFiles("data/classement/semaine").filter(
    (f) => f.startsWith("classement-") && f.endsWith(".json")
  );

  const now = new Date();
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthName = previousMonthDate
    .toLocaleString("fr-FR", { month: "long" })
    .toLowerCase();
  const previousYear = previousMonthDate.getFullYear();

  const monthlyStats = {};
  const weeklyStats = {};

  for (const file of files) {
    const match = file.match(/classement-\d+-(\w+)-(\d+)\.json/);
    if (!match) continue;

    const fileMonth = match[1];
    const fileYear = parseInt(match[2], 10);
    if (fileMonth !== previousMonthName || fileYear !== previousYear) continue;

    const weeklyData = getData(`data/classement/semaine/${file}`)
    for (const entry of weeklyData) {
      const srv = entry.serveur;
      if (!monthlyStats[srv]) {
        monthlyStats[srv] = {
          serveur: srv,
          argentNotation: 0,
          moyenneConnexion: 0,
          count: 0,
        };
      }

      if (!weeklyStats[srv]) {
        weeklyStats[srv] = [];
      }

      monthlyStats[srv].argentNotation += entry.argentNotation || 0;
      monthlyStats[srv].moyenneConnexion += entry.moyenneConnexion || 0;
      monthlyStats[srv].count += 1;

      weeklyStats[srv].push({
        semaine: `S${weeklyStats[srv].length + 1}`,
        argentNotation: entry.argentNotation || 0,
        moyenneConnexion: entry.moyenneConnexion || 0,
      });
    }
  }

  const rankings = Object.values(monthlyStats).map((entry) => ({
    serveur: entry.serveur,
    argentNotation: entry.argentNotation,
    moyenneNotation: entry.argentNotation / entry.count,
    moyenneConnexion: entry.moyenneConnexion / entry.count,
  }));

  rankings.sort((a, b) => b.argentNotation - a.argentNotation);
  rankings.forEach((entry, index) => {
    entry.classementNotation = index + 1;
  });

  rankings.sort((a, b) => b.moyenneConnexion - a.moyenneConnexion);
  rankings.forEach((entry, index) => {
    entry.classementConnection = index + 1;
  });

  const existingFiles = getFiles("data/classement/mois")
    .filter(
      (file) =>
        file.startsWith("classement-") &&
        file.endsWith(`-${previousMonthName}-${previousYear}.json`)
    )
    .map((file) => {
      const match = file.match(/classement-(\d+)-/);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter(Number.isInteger)
    .sort((a, b) => a - b);

  const nextFileNumber =
    existingFiles.length > 0 ? existingFiles[existingFiles.length - 1] + 1 : 1;

  saveData(
    `data/classement/mois/classement-${nextFileNumber}-${previousMonthName}-${previousYear}.json`,
    rankings
  );
  console.log(`Classements mensuels enregistrés avec succès !`);
  return {
    id: nextFileNumber,
    mois: previousMonthName,
    annee: previousYear,
    weeklyStats,
  };
};

async function recapitulatif_mensuel(client) {
  console.log("Exécution de la tâche récapitulatif mensuel...");
  const { id, mois, annee, weeklyStats } = await prepareServerRankings();
  for (const serveur of config.liste_serveur) {
    const serverConfig = getData(`data/${serveur}/config-recap.json`);

    if (
      serverConfig["Récapitulatif Mensuel"].active &&
      serverConfig["Récapitulatif Mensuel"].Salon
    ) {
      const channel = await client.channels
        .fetch(serverConfig["Récapitulatif Mensuel"].Salon)
        .catch(() => null);

      if (channel) {
        const classementData = getData(
          `data/classement/mois/classement-${id}-${mois}-${annee}.json`
        );

        const classementArgentFormatted = formatClassement(
          classementData,
          serveur,
          "argentNotation"
        );
        const classementMoyenneFormatted = formatClassement(
          classementData,
          serveur,
          "moyenneConnexion"
        );

        const serverData = classementData.find(
          (entry) => entry.serveur === serveur
        );

        const argentNotation = serverData ? serverData.argentNotation : 0;
        const moyenneNotation = serverData ? serverData.moyenneNotation : 0;
        const moyenne = serverData ? serverData.moyenneConnexion : 0;

        const moisFormatted = mois.charAt(0).toUpperCase() + mois.slice(1);

        const imageBuffer = await generateGraphImage(weeklyStats[serveur]);

        const attachment = new AttachmentBuilder(imageBuffer, {
          name: "graphique.png",
        });
        const embed = new EmbedBuilder()
          .setTitle(`Récapitulatif Mensuel - ${moisFormatted}`)
          .setThumbnail(
            `${config.glorybot_url}/api/banniere?serveur=${serveur}`
          )
          .addFields([
            {
              name: "Classement des notations :",
              value: classementArgentFormatted,
              inline: true,
            },
            {
              name: "Classement des moyennes :",
              value: classementMoyenneFormatted,
              inline: true,
            },
            {
              name: "Argent total distribué aux notations :",
              value: `${argentNotation.toLocaleString()}$`,
              inline: false,
            },
            {
              name: "Moyenne d'argent distribué aux notations :",
              value: `${moyenneNotation.toLocaleString()}$`,
              inline: false,
            },
            {
              name: "Moyenne des joueurs connectés :",
              value: `${moyenne.toFixed(0)}`,
              inline: true,
            },
          ])
          .setColor(config.couleur[serveur])
          .setFooter({ text: config.footer })
          .setImage("attachment://graphique.png");

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`classement_mensuel-notation-${id}`)
            .setLabel("Classement détaillées : Notations")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`classement_mensuel-connexion-${id}`)
            .setLabel("Classement détaillées : Connexion")
            .setStyle(ButtonStyle.Primary)
        );

        const options = {
          embeds: [embed],
          files: [attachment],
          components: [actionRow],
        };

        const roles = serverConfig["Récapitulatif Mensuel"].Role;

        if (Array.isArray(roles) && roles.length > 0) {
          options.content = roles.map((roleId) => `<@&${roleId}>`).join(" ");
        }

        const sentMessage = await channel.send(options);
        console.log("✅ Récapitulatif mensuel envoyé pour le serveur", serveur);
        if (channel.type === "GUILD_NEWS") {
          try {
            await sentMessage.crosspost();
            console.log(
              `📣 Message publié dans le salon d’annonce pour ${serveur}`
            );
          } catch (err) {
            console.warn(
              `⚠️ Impossible de publier le message dans le salon d’annonce : ${err.message}`
            );
          }
        }
      }
    } else {
      console.log(
        `Récap mensuel désactivé ou pas de salon configuré pour le serveur ${serveur}`
      );
    }
  }
}

module.exports = { recapitulatif_mensuel };
