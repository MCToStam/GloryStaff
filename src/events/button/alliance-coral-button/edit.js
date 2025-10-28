const { showAlliancePage } = require("../../../../util/alliance-coral");
const { getData } = require("../../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "alliance_edit",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const data = getData("data/coral/alliance.donnee.json");
    const allianceNom = interaction.customId.replace("alliance_edit-", "");
    return await showAlliancePage(
      interaction,
      "coral",
      data,
      allianceNom,
      true,
    );
  },
};
