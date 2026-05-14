const {
  ContainerBuilder,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

const { getServeur } = require("../../../../util/module/getServeur");
const { getData, saveData } = require("../../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "quizz_repondre",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);

    const [, semaineId] = interaction.customId.split("-");

    const question1 = interaction.fields.getTextInputValue("question1");
    const question2 = interaction.fields.getTextInputValue("question2");
    const question3 = interaction.fields.getTextInputValue("question3");

    const data = getData(`data/${serveur}/quizz.json`);

    const semaineData = data.find((s) => s.semaineId === Number(semaineId));

    semaineData.question1.reponse.push({
      userId: interaction.user.id,
      reponse: question1,
      bonne_reponse: null,
    });

    semaineData.question2.reponse.push({
      userId: interaction.user.id,
      reponse: question2,
      bonne_reponse: null,
    });

    semaineData.question3.reponse.push({
      userId: interaction.user.id,
      reponse: question3,
      bonne_reponse: null,
    });

    saveData(`data/${serveur}/quizz.json`, data);

    const channel = client.channels.cache.get("1504415278120046622");

    const questions = [
      {
        id: 1,
        question: semaineData.question1.question,
        reponse: question1,
      },
      {
        id: 2,
        question: semaineData.question2.question,
        reponse: question2,
      },
      {
        id: 3,
        question: semaineData.question3.question,
        reponse: question3,
      },
    ];

    for (const questionData of questions) {
      const container = new ContainerBuilder()
        .setAccentColor(config.couleur[serveur])
        .addTextDisplayComponents((text) =>
          text.setContent("## 🧠 Nouvelle Réponse au Quizz"),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((text) =>
          text.setContent(
            `### 👤 Utilisateur :\n<@${interaction.user.id}> (\`${interaction.user.id}\`)`,
          ),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((text) =>
          text.setContent(
            `### ❓ Question ${questionData.id} :\n${questionData.question}`,
          ),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((text) =>
          text.setContent(`### 💬 Réponse :\n${questionData.reponse}`),
        )
        .addSeparatorComponents((separator) => separator)
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(
                `quizz_reponse-bonne-${serveur}-${semaineId}-${questionData.id}-${interaction.user.id}`,
              )
              .setLabel("✅ Bonne Réponse")
              .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
              .setCustomId(
                `quizz_reponse-mauvaise-${serveur}-${semaineId}-${questionData.id}-${interaction.user.id}`,
              )
              .setLabel("❌ Mauvaise Réponse")
              .setStyle(ButtonStyle.Danger),
          ),
        );

      await channel.send({
        components: [container],
        allowedMentions: { parse: [] },
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const container = new ContainerBuilder()
      .setAccentColor(config.colors.success)
      .addTextDisplayComponents((text) =>
        text.setContent("## ✅ Réponses Envoyées"),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((text) =>
        text.setContent("Vos réponses ont correctement été envoyées."),
      );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
