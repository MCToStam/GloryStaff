module.exports = {
  data: {
    name: "modal_edit_categorie",
  },

  async execute(client, interaction, config) {
    const utils = require("../../../../util/gradeUtils");
    await utils.handleInteraction(interaction, client, config);
  },
};
