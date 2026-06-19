const mongoose = require("mongoose");

const { getGloryStaffConnection } = require("../index");

const GloryStaffConnection = getGloryStaffConnection();

const evenementSchema = new mongoose.Schema({
  serveur: { type: String, required: true },
  nom: { type: String, required: true },
  emoji: { type: String },
  description: { type: String },
  createur: { type: Array },
  image: {
    data: String,
    extension: String,
  },
});

module.exports = GloryStaffConnection.model("Evenement", evenementSchema);
