module.exports = {
  data: {
    name: "grade_categorie_edit",
  },

  async execute(client, interaction, config) {
    const utils = require("../../../../util/gradeUtils");
    await utils.handleInteraction(interaction, client, config);
  },
};
