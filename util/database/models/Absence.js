const mongoose = require("mongoose");

const { getGloryStaffConnection } = require("../index");

const GloryStaffConnection = getGloryStaffConnection();

const absenceSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  serveur: { type: String, required: true },
  staff: { type: String, required: true },
  debut: { type: Date },
  fin: { type: Date },
  raison: { type: String },
  channelId: { type: String },
  messageId: { type: String },
});

module.exports = GloryStaffConnection.model("Absence", absenceSchema);
