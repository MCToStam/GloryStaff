const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  LabelBuilder,
} = require("discord.js");
const { getData } = require("../../../util/module/getAndSaveData");
const { getServeur } = require("../../../util/module/getServeur");
const CONFIG_STATIC = require("../../../util/config");
const Configuration = require("../../../util/database/models/Configuration");

module.exports = {
  data: {
    name: "config_modal",
  },

  async execute(client, interaction, config) {
    const [_, type, systemName, key] = interaction.customId.split("-");
    const serveur = await getServeur(interaction);

    const typeData = CONFIG_STATIC.find((c) => c.nom === type);

    const configDoc = await Configuration.findOne({
      serveur,
      categorie: type,
      systeme: systemName,
      guildId: interaction.guild.id,
    });

    const data = typeData.systeme[systemName][key];

    const modal = new ModalBuilder()
      .setCustomId(`config_modal-${type}-${systemName}-${key}`)
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
            .setValue(configDoc.data.get(`${key}_${index}`) || ""),
        );

      modal.addLabelComponents(input);
    });

    return interaction.showModal(modal);
  },
};
