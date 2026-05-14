const {
  ContainerBuilder,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

const { getData, saveData } = require("../../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "quizz_reponse",
  },

  async execute(client, interaction, config) {
    const [_, type, serveur, semaineId, questionId, userId] =
      interaction.customId.split("-");

    const data = getData(`data/${serveur}/quizz.json`);

    const semaineData = data.find((s) => s.semaineId === Number(semaineId));

    if (!semaineData) return;

    const questionKey = `question${questionId}`;

    const reponseData = semaineData[questionKey].reponse.find(
      (r) => r.userId === userId,
    );

    if (!reponseData) return;

    if (reponseData.bonne_reponse !== null) {
      const erreurContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((text) =>
          text.setContent("## ❌ Réponse déjà traitée"),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((text) =>
          text.setContent("Cette réponse a déjà été validée ou refusée."),
        );

      return interaction.reply({
        components: [erreurContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    reponseData.bonne_reponse = type === "bonne";

    saveData(`data/${serveur}/quizz.json`, data);

    const questionTexte =
      semaineData[questionKey]?.question || "Question inconnue";

    const container = new ContainerBuilder()
      .setAccentColor(
        type === "bonne" ? config.colors.success : config.colors.error,
      )

      .addTextDisplayComponents((text) =>
        text.setContent(
          `## ${type === "bonne" ? "✅ Bonne Réponse" : "❌ Mauvaise Réponse"}`,
        ),
      )

      .addSeparatorComponents((separator) => separator)

      .addTextDisplayComponents((text) =>
        text.setContent(`### 👤 Utilisateur :\n<@${userId}> (\`${userId}\`)`),
      )

      .addSeparatorComponents((separator) => separator)

      .addTextDisplayComponents((text) =>
        text.setContent(`### ❓ Question ${questionId} :\n${questionTexte}`),
      )

      .addSeparatorComponents((separator) => separator)

      .addTextDisplayComponents((text) =>
        text.setContent(`### 💬 Réponse :\n${reponseData.reponse}`),
      )

      .addSeparatorComponents((separator) => separator)

      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("quizz_locked")
            .setLabel(
              type === "bonne" ? "✅ Bonne Réponse" : "❌ Mauvaise Réponse",
            )
            .setStyle(
              type === "bonne" ? ButtonStyle.Success : ButtonStyle.Danger,
            )
            .setDisabled(true),
        ),
      );

    return interaction.update({
      components: [container],
      allowedMentions: { parse: [] },
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
