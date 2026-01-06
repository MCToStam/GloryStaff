const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
} = require("discord.js");
const proxyCommande = require("../../../util/proxy/proxyCommande");

module.exports = {
  config: { permission: "super_moderateur" },
  data: new SlashCommandBuilder()
    .setName("points-affilie")
    .setDescription("Affiche les récompenses des points affiliés")
    .addIntegerOption((option) =>
      option
        .setName("points")
        .setDescription(
          "Le nombre de points avec lequel afficher les récompenses",
        )
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("euro")
        .setDescription(
          "Le nombre d'euro pour lequel afficher les point requis",
        )
        .setRequired(false),
    ),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur, points, euro } = interaction.parametre;
    const point = points ? parseInt(points, 10) : null;
    const euros = euro ? parseInt(euro, 10) : null;

    const rewards = [
      { emoji: "🎖️", points: 5, label: "Badge Viewer" },
      { emoji: "💶", points: 75, label: "10€", euro: 10 },
      { emoji: "💶", points: 150, label: "20€", euro: 20 },
      { emoji: "💶", points: 350, label: "50€", euro: 50 },
    ];

    let description = "";

    if (!point && !euros) {
      description = rewards
        .map((r) => `${r.emoji} **${r.points} points** → ${r.label}`)
        .join("\n");
    } else if (euros) {
      const euroRewards = rewards.filter((r) => r.euro);

      let best = null;

      const maxCounts = euroRewards.map((r) => Math.ceil(euros / r.euro) + 2);

      function search(index, currentEuro, currentPoints, counts) {
        if (index === euroRewards.length) {
          if (currentEuro >= euros) {
            if (
              !best ||
              currentPoints < best.points ||
              (currentPoints === best.points && currentEuro < best.euros)
            ) {
              best = {
                euros: currentEuro,
                points: currentPoints,
                counts: [...counts],
              };
            }
          }
          return;
        }

        const reward = euroRewards[index];

        for (let i = 0; i <= maxCounts[index]; i++) {
          search(
            index + 1,
            currentEuro + i * reward.euro,
            currentPoints + i * reward.points,
            [...counts, i],
          );
        }
      }

      search(0, 0, 0, []);

      if (!best) {
        description = `❌ Impossible d’atteindre **${euros}€**.`;
      } else {
        const details = euroRewards
          .map((r, i) => {
            const count = best.counts[i];
            if (count === 0) return null;
            return `• ${count} × ${r.label}`;
          })
          .filter(Boolean)
          .join("\n");

        description =
          `💶 Pour obtenir **au moins ${euros}€** :\n\n` +
          `${details}\n\n` +
          `➡️ **${best.points} points** nécessaires, soit ${Math.ceil(
            best.points / 15,
          )} vidéo${Math.ceil(best.points / 15) > 1 ? "s" : ""}\n` +
          `➡️ Donne **${best.euros}€**`;
      }
    } else if (point) {
      const availableRewards = rewards
        .filter((r) => point >= r.points)
        .sort((a, b) => b.points - a.points);

      if (availableRewards.length === 0) {
        description = `❌ Avec **${point} points**, aucune récompense n'est disponible.`;
      } else {
        description = availableRewards
          .map((r) => {
            const count = Math.floor(point / r.points);
            return `${r.emoji} **${r.points} points** → ${r.label}\n↪ ${
              r.euro
                ? `**${count * r.euro}€**`
                : `**${count} badge${count > 1 ? "s" : ""} viewer**`
            } pour **${count * r.points}** points`;
          })
          .join("\n\n");
      }
    }

    const pointsContainer = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## Points Affiliés - ${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }`,
        ),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) => t.setContent(description));

    if (interaction.isMessageComponent()) {
      return interaction.update({
        components: [pointsContainer],
        flags: MessageFlags.IsComponentsV2,
      });
    } else {
      return interaction.reply({
        components: [pointsContainer],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  },
};
