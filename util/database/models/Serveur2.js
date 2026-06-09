const mongoose = require("mongoose");

const { getGloryProjectsConnection } = require("../index");

const GloryProjectsConnection = getGloryProjectsConnection();

const serveurDiscordSchema = new mongoose.Schema({
  robot: { type: String, required: true, unique: true },
  serveur: { type: Array, required: true },
});

module.exports = GloryProjectsConnection.model("Serveur", serveurDiscordSchema);
