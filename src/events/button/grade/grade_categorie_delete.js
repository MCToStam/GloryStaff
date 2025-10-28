module.exports = {
  data: {
    name: "grade_categorie_delete",
  },

  async execute(client, interaction, config) {
    const utils = require("../../../../util/gradeUtils");
    // This file is a thin wrapper for the interaction 'grade_categorie_delete'
    // The heavy logic is implemented in utils/gradeUtils.handleInteraction
    await utils.handleInteraction(interaction, client, config);
  },
};
