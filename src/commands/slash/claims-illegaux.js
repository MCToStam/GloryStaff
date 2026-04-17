const {
  MessageFlags,
  ContainerBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  SlashCommandBuilder,
} = require("discord.js");
const Pays = require("../../../util/database/models/Pays");
const proxyCommande = require("../../../util/proxy/proxyCommande");

function getAllChunksFromPolygon(xList, zList) {
  const polygon = xList.map((x, i) => [
    Math.floor(x / 16),
    Math.floor(zList[i] / 16),
  ]);

  const xs = polygon.map((p) => p[0]);
  const zs = polygon.map((p) => p[1]);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);

  function isInside(x, z, poly) {
    let inside = false;

    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0],
        zi = poly[i][1];
      const xj = poly[j][0],
        zj = poly[j][1];

      const intersect =
        zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }

  const chunks = [];

  for (let x = minX; x <= maxX; x++) {
    for (let z = minZ; z <= maxZ; z++) {
      if (isInside(x + 0.5, z + 0.5, polygon)) {
        chunks.push({ x, z });
      }
    }
  }

  return chunks;
}

function detectThinLines(chunks) {
  const chunkSet = new Set(chunks.map((c) => `${c.x},${c.z}`));

  const map = new Map();

  for (const { x, z } of chunks) {
    if (!map.has(x)) map.set(x, []);
    map.get(x).push(z);
  }

  for (const [x, zList] of map.entries()) {
    const sorted = zList.sort((a, b) => a - b);

    let streak = 1;

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1] + 1) {
        streak++;
      } else {
        streak = 1;
      }

      if (streak >= 5) {
        let thin = true;
        let badChunk = null;

        for (let dz = 0; dz < streak; dz++) {
          const z = sorted[i] - dz;

          const hasLeft = chunkSet.has(`${x - 1},${z}`);
          const hasRight = chunkSet.has(`${x + 1},${z}`);

          let neighbors = 0;
          if (hasLeft) neighbors++;
          if (hasRight) neighbors++;

          if (neighbors >= 1) {
            thin = false;
            break;
          }

          badChunk = { x, z };
        }

        if (thin) return badChunk;
      }
    }
  }

  const mapZ = new Map();

  for (const { x, z } of chunks) {
    if (!mapZ.has(z)) mapZ.set(z, []);
    mapZ.get(z).push(x);
  }

  for (const [z, xList] of mapZ.entries()) {
    const sorted = xList.sort((a, b) => a - b);

    let streak = 1;

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1] + 1) {
        streak++;
      } else {
        streak = 1;
      }

      if (streak >= 5) {
        let thin = true;
        let badChunk = null;

        for (let dx = 0; dx < streak; dx++) {
          const x = sorted[i] - dx;

          const hasUp = chunkSet.has(`${x},${z - 1}`);
          const hasDown = chunkSet.has(`${x},${z + 1}`);

          let neighbors = 0;
          if (hasUp) neighbors++;
          if (hasDown) neighbors++;

          if (neighbors >= 1) {
            thin = false;
            break;
          }

          badChunk = { x, z };
        }

        if (thin) return badChunk;
      }
    }
  }

  return false;
}

const MAX_COORDS = 20;

function paginateByCoords(data, max) {
  const pages = [];
  let currentPage = [];
  let currentCount = 0;

  for (const item of data) {
    const coordsCount = item.claims.length;

    if (coordsCount > max) {
      const chunks = [];

      for (let i = 0; i < item.claims.length; i += max) {
        chunks.push({
          ...item,
          claims: item.claims.slice(i, i + max),
        });
      }

      for (const chunk of chunks) {
        pages.push([chunk]);
      }

      continue;
    }

    if (currentCount + coordsCount > max) {
      if (currentPage.length) pages.push(currentPage);
      currentPage = [item];
      currentCount = coordsCount;
    } else {
      currentPage.push(item);
      currentCount += coordsCount;
    }
  }

  if (currentPage.length) pages.push(currentPage);

  return pages;
}

module.exports = {
  config: { permission: "guide" },
  data: new SlashCommandBuilder()
    .setName("claims-illegaux")
    .setDescription("Affiche les pays ayant des claims illégaux")
    .addStringOption((option) =>
      option
        .setName("dimension")
        .setDescription("Dimension")
        .setRequired(false)
        .addChoices(
          { name: "Terre", value: "world" },
          { name: "Lune", value: "DIM-28" },
          { name: "Mars", value: "DIM-29" },
          { name: "Edora", value: "DIM-31" },
        ),
    ),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur, dimension } = interaction.parametre;

    const dimensionKey = dimension || "world";

    const planets = {
      world: { name: "Terre", emoji: "<:terre:1431635820221304975>" },
      "DIM-28": { name: "Lune", emoji: "<:lune:1431635822393692350>" },
      "DIM-29": { name: "Mars", emoji: "<:mars:1431635823660630016>" },
      "DIM-31": { name: "Edora", emoji: "<:edora:1431635824784707644>" },
    };

    const planetInfo = planets[dimensionKey];
    if (!planetInfo) return;
    const dimensionName = planetInfo.name;

    const data = await Pays.find(
      {
        server: serveur,
        [`coordonnee.${dimensionName}`]: { $exists: true, $ne: [] },
      },
      { name: 1, coordonnee: 1 },
    );

    const countriesWithClaims = data
      .map((pays) => {
        const claims = pays.coordonnee?.[dimensionName];
        if (claims.length === 0) return;
        if (claims.length > 1) {
          return {
            reason: "Claims séparés",
            country: pays.name,
            claims,
          };
        } else {
          const chunks = getAllChunksFromPolygon(claims[0].x, claims[0].z);
          const result = detectThinLines(chunks);
          if (result) {
            return {
              reason: "Claims de moins de 3 de largeur",
              country: pays.name,
              claims: [{ x: [result.x * 16 + 8], z: [result.z * 16 + 8] }],
            };
          }
        }
      })
      .filter(Boolean)
      .sort((a, b) =>
        a.country.localeCompare(b.country, "fr", { sensitivity: "base" }),
      );

    const pages = paginateByCoords(countriesWithClaims, MAX_COORDS);

    const totalPages = pages.length;
    const page = 0;

    const currentPageData = pages[page] || [];

    let description = currentPageData
      .map(({ reason, country, claims }) => {
        const coordsText = claims
          .map(
            (c) =>
              `↪ [${c.x[0]} 65 ${c.z[0]}](${config.dynmapColorMap[serveur]}/?worldname=${dimensionKey}&zoom=4&x=${c.x[0]}&z=${c.z[0]}&nocompass=true)`,
          )
          .join("\n");

        return `**${country}** : ${reason}\n${coordsText}`;
      })
      .join("\n");

    if (!description)
      description =
        "Aucun pays ayant des claims illégaux n'a été trouvé sur cette dimension.";

    const options = Object.entries(planets).map(([value, planet]) => ({
      label: planet.name,
      value: `claims_illegaux-${serveur}-${value}`,
      emoji: planet.emoji,
      default: value === dimensionKey,
    }));

    const container = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `## ${planetInfo.emoji} Claims Illégaux - ${planetInfo.name}`,
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(description),
      )
      .addSeparatorComponents((separator) => separator)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(
              `claimsillegaux_page-${page - 1}-${serveur}-${dimensionName}`,
            )
            .setEmoji("◀️")
            .setDisabled(page <= 0)
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("claimsillegaux_page_status")
            .setLabel(`Page ${page + 1}/${totalPages}`)
            .setDisabled(true)
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(
              `claimsillegaux_page-${page + 1}-${serveur}-${dimensionName}`,
            )
            .setEmoji("▶️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page + 1 >= totalPages),
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("claims_illegaux")
            .setPlaceholder("Sélectionnez une dimension")
            .addOptions(options),
        ),
      );

    if (interaction.isMessageComponent()) {
      return interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } else {
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  },
};
