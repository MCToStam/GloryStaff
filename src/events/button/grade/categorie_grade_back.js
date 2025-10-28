module.exports = {
  data: {
    name: "categorie_grade_back",
  },

  async execute(client, interaction, config) {
    const utils = require("../../../../util/gradeUtils");
    // This file is a thin wrapper for the interaction 'categorie_grade_back'
    // The heavy logic is implemented in utils/gradeUtils.handleInteraction
    await utils.handleInteraction(interaction, client, config);
  },
};
