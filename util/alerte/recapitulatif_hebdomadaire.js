const config = require("../../config");
const {
  getFiles,
  getData,
  saveData,
} = require("../../util/module/getAndSaveData");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require("discord.js");

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
  const weekRes = await fetch(`${config.glorybot_url}/api/notationWeek`);
  const weekJson = await weekRes.json();
  const week = weekJson.semaine;
  const actualDate = new Date();
  const actualYear = actualDate.getFullYear();

  const rankings = [];

  for (const serveur of config.liste_serveur) {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const responseArgent = await fetch(
      `${config.glorybot_url}/api/notations/?week=${week}&serveur=${serveur}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.glorybot_token}`,
          "Content-Type": "application/json",
        },
      },
    );

    let argentNotation = 0;
    if (responseArgent.ok) {
      const dataArgent = await responseArgent.json();
      argentNotation = dataArgent
        .filter((p) => p.server === serveur)
        .reduce((total, item) => total + (item.bourse || 0), 0);
    } else {
      console.log(`Erreur API pour ${serveur} : ${responseArgent.statusText}`);
      continue;
    }

    const responseConnexion = await fetch(
      `${config.glorybot_url}/connection/${serveur}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    let moyenneConnexion = 0;
    if (responseConnexion.ok) {
      const dataConnexion = await responseConnexion.json();
      const values = [];

      dataConnexion.forEach((entry) => {
        const rawData = entry.data;
        Object.keys(rawData).forEach((key) => {
          values.push(rawData[key]);
        });
      });

      const total = values.reduce((acc, curr) => acc + curr, 0);
      moyenneConnexion = total / values.length || 0;
    } else {
      console.log(
        `Erreur API pour ${serveur} : ${responseConnexion.statusText}`,
      );
      continue;
    }

    rankings.push({
      serveur,
      argentNotation,
      moyenneConnexion,
    });
  }

  rankings.sort((a, b) => b.argentNotation - a.argentNotation);
  rankings.forEach((entry, index) => {
    entry.classementNotation = index + 1;
  });

  rankings.sort((a, b) => b.moyenneConnexion - a.moyenneConnexion);
  rankings.forEach((entry, index) => {
    entry.classementConnection = index + 1;
  });

  const existingFiles = getFiles("data/classement/semaine")
    .filter((file) => file.startsWith("classement-") && file.endsWith(".json"))
    .map((file) => {
      const match = file.match(/classement-(\d+)-.+\.json/);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter(Number.isInteger)
    .sort((a, b) => a - b);

  const nextFileNumber =
    existingFiles.length > 0 ? existingFiles[existingFiles.length - 1] + 1 : 1;
  const moisActuel = new Date()
    .toLocaleString("fr-FR", { month: "long" })
    .toLowerCase();

  saveData(
    `data/classement/semaine/classement-${nextFileNumber}-${moisActuel}-${actualYear}.json`,
    rankings,
  );
  console.log(`Classements hebdomadaireenregistrés avec succès !`);
  return { id: nextFileNumber, mois: moisActuel, annee: actualYear };
};

async function recapitulatif_hebdomadaire(client) {
  console.log("Exécution de la tâche récapitulatif hebdomadaire...");
  const { id, mois, annee } = await prepareServerRankings();
  for (const serveur of config.liste_serveur) {
    const serverConfig = getData(`data/${serveur}/config-recap.json`);

    if (
      serverConfig["Récapitulatif Hebdomadaire"].active &&
      serverConfig["Récapitulatif Hebdomadaire"].Salon.valeur
    ) {
      const channel = await client.channels
        .fetch(serverConfig["Récapitulatif Hebdomadaire"].Salon.valeur)
        .catch(() => null);

      if (channel) {
        const classementData = getData(
          `data/classement/semaine/classement-${id}-${mois}-${annee}.json`,
        );

        const argentNotation =
          classementData.find((entry) => entry.serveur === serveur)
            ?.argentNotation || 0;

        const response_connexion = await fetch(
          `${config.glorybot_url}/connection/${serveur}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!response_connexion.ok) {
          console.log(
            `Erreur de l'API pour le serveur ${serveur} : ${response_connexion.statusText}`,
          );
          return;
        }

        const data_connexion = await response_connexion.json();

        const labels = [];
        const labels2 = [];
        const values = [];
        let maxDate = "";

        data_connexion.forEach((entry) => {
          const rawData = entry.data;
          Object.keys(rawData).forEach((key) => {
            const [datePart, timePart] = key.split(" ");
            const [hours, minutes] = timePart.split(":");
            const label2 = `${hours}h${minutes}`;
            const label = ` `;
            labels.push(label);
            labels2.push(label2);
            values.push(rawData[key]);
          });
        });

        const total = values.reduce((acc, curr) => acc + curr, 0);
        const moyenne = total / values.length;

        const maxValue = Math.max(...values);

        data_connexion.forEach((entry) => {
          const rawData = entry.data;
          Object.keys(rawData).forEach((key) => {
            const [datePart, timePart] = key.split(" ");
            const [hours, minutes] = timePart.split(":");
            const label2 = `${hours}h${minutes}`;

            if (rawData[key] === maxValue) {
              maxDate = `${entry.date} ${label2}`;
            }
          });
        });

        const width = 800;
        const height = 400;
        const chartJSNodeCanvas = new ChartJSNodeCanvas({
          width,
          height,
        });

        let couleur_graphique =
          serveur === "black"
            ? config.couleur["white"]
            : config.couleur[serveur];

        const couleur_hex = `#${couleur_graphique
          .toString(16)
          .padStart(6, "0")}`;

        const configuration = {
          type: "line",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Statistiques du Serveur",
                data: values,
                fill: false,
                borderColor: couleur_hex,
                tension: 0.1,
                yAxisID: "y-left",
                pointRadius: 0,
              },
            ],
          },
          options: {
            scales: {
              x: {
                title: {
                  display: false,
                  text: "Heure",
                },
                reverse: false,
              },
              "y-left": {
                type: "linear",
                position: "left",
                title: {
                  display: true,
                  text: "Nombre de joueurs",
                },
              },
            },
            plugins: {
              legend: {
                labels: {
                  color: "white",
                },
              },
            },
            layout: {
              padding: 20,
            },
            backgroundColor: "rgba(0, 0, 0, 0)",
          },
          plugins: [
            {
              beforeDraw: (chart) => {
                const ctx = chart.ctx;
                ctx.save();
                ctx.fillStyle = "rgb(43, 45, 49)";
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
              },
            },
          ],
        };

        const imageBuffer =
          await chartJSNodeCanvas.renderToBuffer(configuration);

        const classementArgentFormatted = formatClassement(
          classementData,
          serveur,
          "argentNotation",
        );
        const classementMoyenneFormatted = formatClassement(
          classementData,
          serveur,
          "moyenneConnexion",
        );

        const attachment = new AttachmentBuilder(imageBuffer, {
          name: "graphique.png",
        });
        const embed = new EmbedBuilder()
          .setTitle("Récapitulatif Hebdomadaire")
          .setThumbnail(
            `${config.glorybot_url}/api/banniere?serveur=${serveur}`,
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
              name: "Moyenne des joueurs connectés :",
              value: `${moyenne.toFixed(0)}`,
              inline: true,
            },
            {
              name: "Maximal de joueurs connectés :",
              value: `${maxValue}`,
              inline: false,
            },
            {
              name: "Date de la maximale :",
              value: `${maxDate}`,
              inline: true,
            },
          ])
          .setColor(config.couleur[serveur])
          .setFooter({ text: config.footer })
          .setImage("attachment://graphique.png");

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`classement_hebdomadaire-notation-${id}`)
            .setLabel("Classement détaillées : Notations")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`classement_hebdomadaire-connexion-${id}`)
            .setLabel("Classement détaillées : Connexion")
            .setStyle(ButtonStyle.Primary),
        );

        const options = {
          embeds: [embed],
          files: [attachment],
          components: [actionRow],
        };

        const roles = serverConfig["Récapitulatif Hebdomadaire"].Role.valeur;

        if (Array.isArray(roles) && roles.length > 0) {
          options.content = roles.map((roleId) => `<@&${roleId}>`).join(" ");
        }

        const sentMessage = await channel.send(options);
        console.log(
          "✅ Récapitulatif hebdomadaire envoyé pour le serveur",
          serveur,
        );
        if (channel.type === "GUILD_NEWS") {
          try {
            await sentMessage.crosspost();
            console.log(
              `📣 Message publié dans le salon d’annonce pour ${serveur}`,
            );
          } catch (err) {
            console.warn(
              `⚠️ Impossible de publier le message dans le salon d’annonce : ${err.message}`,
            );
          }
        }
      }
    } else {
      console.log(
        `❌ Récap hebdomadaire désactivé ou pas de salon configuré pour le serveur ${serveur}`,
      );
    }
  }
}

module.exports = { recapitulatif_hebdomadaire };
