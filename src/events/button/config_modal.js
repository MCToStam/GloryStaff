const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  LabelBuilder,
} = require("discord.js");
const { getData } = require("../../../util/module/getAndSaveData");
const { getServeur } = require("../../../util/module/getServeur");

module.exports = {
  data: {
    name: "config_modal",
  },

  async execute(client, interaction, config) {
    const [_, file, systemName, key] = interaction.customId.split("-");
    const serveur = await getServeur(interaction);

    const configData = getData(`data/${serveur}/config-${file}.json`);

    const data = configData[systemName][key];

    const modal = new ModalBuilder()
      .setCustomId(`config_modal-${file}-${systemName}-${key}`)
      .setTitle(`Mettre à jour les données`);

    data.questions.forEach((q, index) => {
      const input = new LabelBuilder()
        .setLabel(q.texte || `Question ${index + 1}`)
        .setDescription(q.description || "")
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId(`question_${index}`)
            .setStyle(TextInputStyle[q.style])
            .setPlaceholder(q.placeholder || "")
            .setRequired(q.obligatoire)
            .setMaxLength(q.maxCara || 100)
            .setValue(q.valeur || ""),
        );

      modal.addLabelComponents(input);
    });

    return interaction.showModal(modal);
  },
};
