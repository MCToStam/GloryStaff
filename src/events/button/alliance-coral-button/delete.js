const { showAllianceList } = require("../../../../util/alliance-coral");
const { getData, saveData } = require("../../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "alliance_delete",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    let data = getData("data/coral/alliance.donnee.json");
    const allianceNom = interaction.customId.replace("alliance_delete-", "");
    data = data.filter((a) => a.nom !== allianceNom);
    saveData("data/coral/alliance.donnee.json", data);

    return await showAllianceList(interaction, "coral", data);
  },
};
