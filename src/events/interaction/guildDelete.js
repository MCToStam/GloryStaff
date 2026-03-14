const updateServeurDB = require("../../../util/module/updateServeurDB");

module.exports = async (client, guild) => {
  try {
    await updateServeurDB(client);
  } catch (err) {
    console.error("Erreur lors du traitement du départ :", err);
  }
};
