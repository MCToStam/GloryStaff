const mongoose = require("mongoose");
const log = require("../../util/module/log");

let GloryProjectsConnection;
let GloryStaffConnection;

async function connectMongo() {
  try {
    GloryProjectsConnection = await mongoose.createConnection(
      process.env.MONGO_URI_GLORYPROJECTS,
    );

    GloryStaffConnection = await mongoose.createConnection(
      process.env.MONGO_URI_GLORYSTAFF,
    );

    log("MongoDB est correctement connecté", "READY", "green");
  } catch (err) {
    log(`❌ Erreur lors de la connexion à MongoDB : ${err}`, "error", "red");
  }
}

module.exports = {
  connectMongo,
  getGloryProjectsConnection: () => GloryProjectsConnection,
  getGloryStaffConnection: () => GloryStaffConnection,
};
