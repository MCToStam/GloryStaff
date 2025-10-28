module.exports = {
  data: {
    name: "modal_subtitlerank_grade",
  },

  async execute(client, interaction, config) {
    const utils = require("../../../../util/gradeUtils");
    // This file is a thin wrapper for the interaction 'modal_subtitlerank_grade'
    // The heavy logic is implemented in utils/gradeUtils.handleInteraction
    await utils.handleInteraction(interaction, client, config);
  },
};
