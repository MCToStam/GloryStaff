const mongoose = require("mongoose");
const log = require("../../util/module/log");

async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    log("MongoDB est correctement connecté", "READY", "green");
  } catch (err) {
    log(`❌ Erreur lors de la connexion à MongoDB : ${err}`, "error", "red");
  }
}

module.exports = connectMongo;
