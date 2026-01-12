const {
  SlashCommandBuilder,
  ContainerBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} = require("discord.js");
const proxyCommande = require("../../../util/proxy/proxyCommande");

module.exports = {
  config: { permission: "guide" },
  data: new SlashCommandBuilder()
    .setName("claims-illegaux")
    .setDescription("Affiche les pays ayant des claims illégaux"),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur } = interaction.parametre;
    const dimension = "world";

    const planets = {
      world: { name: "Terre", emoji: "<:terre:1460314757918888224>" },
      "DIM-28": { name: "Lune", emoji: "<:lune:1460314759512588338>" },
      "DIM-29": { name: "Mars", emoji: "<:mars:1460314761064611973>" },
      "DIM-31": { name: "Edora", emoji: "<:edora:1460314762838671542>" },
    };

    const planetInfo = planets[dimension];

    const dataRes = await fetch(
      `${config.glorybot_url}/api/coordPays?serveur=${serveur}`,
    );
    const data = await dataRes.json();

    const countriesWithClaims = Object.entries(data.data)
      .map(([country, dims]) => {
        const claims = dims.details?.[planetInfo.name];
        if (!Array.isArray(claims) || claims.length === 0) return null;

        const multipleClaims = claims.length > 1;

        if (!multipleClaims) return null;

        return {
          country,
          multipleClaims,
        };
      })
      .filter(Boolean)
      .sort((a, b) =>
        a.country.localeCompare(b.country, "fr", { sensitivity: "base" }),
      );

    let description = countriesWithClaims
      .map(({ country, multipleClaims }) => {
        const reasons = [];

        if (multipleClaims) reasons.push("Claims séparés");

        return `**${country} :** ${reasons.join(", ")}`;
      })
      .join("\n");

    if (!description)
      description =
        "Aucun pays ayant des claims illégaux n'a été trouvé sur cette dimension.";

    const options = Object.entries(planets).map(([value, planet]) => ({
      label: planet.name,
      value: `claims_illegaux-${serveur}-${value}`,
      emoji: planet.emoji,
      default: value === dimension,
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
