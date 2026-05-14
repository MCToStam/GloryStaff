const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} = require("discord.js");
const { getData, saveData } = require("../../../../util/module/getAndSaveData");
const { getServeur } = require("../../../../util/module/getServeur");

module.exports = {
  data: {
    name: "quizz_modifier",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);
    const [, semaineId, index] = interaction.customId.split("-");

    const data = getData(`data/${serveur}/quizz.json`);
    const semaineData = data.find((s) => s.semaineId === Number(semaineId));
    const questionData = semaineData[`question${index}`];

    const modal = new ModalBuilder()
      .setCustomId(`quizz_modifier-${semaineId}-${index}`)
      .setTitle(`✏️ Modifier la Question ${index}`);

    const question = new TextInputBuilder()
      .setCustomId("question")
      .setLabel("Question à poser")
      .setValue(questionData.question)
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(question));

    return interaction.showModal(modal);
  },
};
