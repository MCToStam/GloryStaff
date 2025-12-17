const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
} = require("discord.js");
const { discordStaff } = require("../../../util/module/discordLink");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("points-affilie")
    .setDescription("Affiche les récompenses des points affiliés")
    .addStringOption((option) =>
      option
        .setName("points")
        .setDescription(
          "Le nombre de points avec lequel afficher les récompenses",
        )
        .setRequired(false),
    ),

  async execute(client, interaction, config) {
    const pointsInput = interaction.options.getString("points");
    const points = pointsInput ? parseInt(pointsInput, 10) : null;

    const { pseudonym, servers, container } = await discordStaff(
      interaction.user.id,
      "all",
      "super_moderateur",
    );

    const serveur = servers[0];

    if (container) {
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const rewards = [
      { emoji: "🎖️", points: 5, label: "Badge Viewer" },
      { emoji: "💶", points: 75, label: "10€", euro: 10 },
      { emoji: "💶", points: 150, label: "20€", euro: 20 },
      { emoji: "💶", points: 350, label: "50€", euro: 50 },
    ];

    let description = "";
    if (!points) {
      description = rewards
        .map((r) => `${r.emoji} **${r.points} points** → ${r.label}`)
        .join("\n");
    } else {
      const availableRewards = rewards
        .filter((r) => points >= r.points)
        .sort((a, b) => b.points - a.points);

      if (availableRewards.length === 0) {
        description = `❌ Avec **${points} points**, aucune récompense n'est disponible.`;
      } else {
        description = availableRewards
          .map((r) => {
            const count = Math.floor(points / r.points);
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

    return interaction.reply({
      components: [pointsContainer],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
