const {
  SlashCommandBuilder,
  ContainerBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} = require("discord.js");
const { getData } = require("../../../util/module/getAndSaveData");

const YES = "✅";
const NO = "❌";

function formatMinutes(min) {
  return min && min > 0 ? `${min}` : "—";
}

function pad(value, length) {
  return String(value).padEnd(length, " ");
}

const COLS = {
  name: 28,
  toxicity: 20,
  warn: 6,
  mute: 10,
  jail: 10,
  ban: 10,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sanctions")
    .setDescription("Affiche les sanctions et les paliers de toxicité"),

  async execute(client, interaction, config) {
    const data = getData("data/sanctionsCache.json");
    const category = "chat";

    const sanctions = data.sanctions.filter(
      (sanction) => sanction.category === category,
    );

    let description = "aaaa";

    const container = new ContainerBuilder()
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(`## 💢 Sanctions`),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(description),
      )
      .addSeparatorComponents((separator) => separator)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("sanctions")
            .setPlaceholder("Sélectionnez une option")
            .addOptions([
              {
                label: "Sanction Tchat",
                value: "sanctions-sanctions-chat",
                default: true,
              },
              {
                label: "Sanction Vocale",
                value: "sanctions-sanctions-vocal",
                default: true,
              },
              {
                label: "Sanctions de Jeu",
                value: "sanctions-sanctions-game",
                default: true,
              },
              { label: "Tiers", value: "sanctions-tiers" },
            ]),
        ),
      );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
