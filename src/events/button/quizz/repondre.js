const {
  ModalBuilder,
  ContainerBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} = require("discord.js");
const { getData, saveData } = require("../../../../util/module/getAndSaveData");
const { getServeur } = require("../../../../util/module/getServeur");

module.exports = {
  data: {
    name: "quizz_repondre",
    all: true,
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);
    const [, semaineId] = interaction.customId.split("-");

    const data = getData(`data/${serveur}/quizz.json`);
    const semaineData = data.find((s) => s.semaineId === Number(semaineId));

    const dejaRepondu = semaineData.question1.reponse.some(
      (r) => r.userId === interaction.user.id,
    );

    if (dejaRepondu) {
      const erreurContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)

        .addTextDisplayComponents((text) =>
          text.setContent("## ❌ Vous avez déjà répondu"),
        )

        .addSeparatorComponents((separator) => separator)

        .addTextDisplayComponents((text) =>
          text.setContent(
            "Vous ne pouvez répondre qu'une seule fois au quizz de cette semaine.",
          ),
        );

      return interaction.reply({
        components: [erreurContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`quizz_repondre-${semaineId}`)
      .setTitle("💬 Répondre aux Questions");

    const question1 = new TextInputBuilder()
      .setCustomId("question1")
      .setLabel("Question 1")
      .setPlaceholder(semaineData.question1.question.slice(0, 100))
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const question2 = new TextInputBuilder()
      .setCustomId("question2")
      .setLabel("Question 2")
      .setPlaceholder(semaineData.question2.question.slice(0, 100))
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const question3 = new TextInputBuilder()
      .setCustomId("question3")
      .setLabel("Question 3")
      .setPlaceholder(semaineData.question3.question.slice(0, 100))
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(question1),
      new ActionRowBuilder().addComponents(question2),
      new ActionRowBuilder().addComponents(question3),
    );

    return interaction.showModal(modal);
  },
};
