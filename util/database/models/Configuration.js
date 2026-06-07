const mongoose = require("mongoose");

const { getGloryStaffConnection } = require("../index");

const GloryStaffConnection = getGloryStaffConnection();

const configurationSchema = new mongoose.Schema({
  serveur: { type: String, required: true },
  categorie: { type: String, required: true },
  systeme: { type: String, required: true },
  guildId: { type: String, required: true },
  active: { type: Boolean, default: false },
  data: { type: Map, default: {} },
});

module.exports = GloryStaffConnection.model(
  "Configuration",
  configurationSchema,
);
