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
    name: "quizz_modifier",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);
    const [, semaineId, index] = interaction.customId.split("-");

    const question = interaction.fields.getTextInputValue("question");

    const data = getData(`data/${serveur}/quizz.json`);
    const semaineData = data.find((s) => s.semaineId === Number(semaineId));
    const questionData = semaineData[`question${index}`];
    questionData.question = question;
    saveData(`data/${serveur}/quizz.json`, data);

    let dernierQuizz = data[data.length - 1];

    const maintenant = new Date();

    const semaineActuelle = getWeekNumber(maintenant);

    const semaineDernierQuizz =
      dernierQuizz && dernierQuizz.envoyer
        ? getWeekNumber(new Date(dernierQuizz.envoyer))
        : null;

    const memeSemaine = semaineActuelle === semaineDernierQuizz;

    if (!dernierQuizz || (dernierQuizz.envoyer !== 0 && !memeSemaine)) {
      const nouveauId =
        data.length > 0
          ? Math.max(...data.map((q) => q.semaineId || 0)) + 1
          : 1;

      dernierQuizz = {
        semaineId: nouveauId,
        envoyer: 0,

        question1: {
          question: "",
          reponse: [],
        },

        question2: {
          question: "",
          reponse: [],
        },

        question3: {
          question: "",
          reponse: [],
        },
      };

      data.push(dernierQuizz);

      saveData(`data/${serveur}/quizz.json`, data);
    }

    const questions = [
      dernierQuizz.question1,
      dernierQuizz.question2,
      dernierQuizz.question3,
    ];

    const questionsValides = questions.filter(
      (q) => q && q.question && q.question.trim().length > 0,
    );

    const container = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((text) =>
        text.setContent("## 🧠 Gestion du Quizz"),
      );

    questions.forEach((question, index) => {
      container
        .addSeparatorComponents((separator) => separator)
        .addSectionComponents((section) =>
          section
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent(
                `### Question ${index + 1} :\n${
                  question?.question?.trim()?.length > 0
                    ? question.question
                    : "*Aucune question définie*"
                }`,
              ),
            )
            .setButtonAccessory((button) =>
              button
                .setCustomId(
                  `quizz_modifier-${dernierQuizz.semaineId}-${index + 1}`,
                )
                .setLabel(`✏️ Modifier la Question ${index + 1}`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(dernierQuizz.envoyer !== 0),
            ),
        );
    });

    return interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};

function getWeekNumber(date) {
  const currentDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );

  const dayNum = currentDate.getUTCDay() || 7;

  currentDate.setUTCDate(currentDate.getUTCDate() + 4 - dayNum);

  const yearStart = new Date(Date.UTC(currentDate.getUTCFullYear(), 0, 1));

  return Math.ceil(((currentDate - yearStart) / 86400000 + 1) / 7);
}
