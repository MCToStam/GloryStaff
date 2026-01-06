module.exports = {
  data: {
    name: "modal_couleur_grade",
  },

  async execute(client, interaction, config) {
    const utils = require("../../../../util/gradeUtils");
    await utils.handleInteraction(interaction, client, config);
  },
};
