const mongoose = require("mongoose");

const { getGloryStaffConnection } = require("../index");

const GloryStaffConnection = getGloryStaffConnection();

const explosionSchema = new mongoose.Schema({
  type: { type: String, required: true },
  x: { type: Number },
  z: { type: Number },
});

const recapitulatifAssautSchema = new mongoose.Schema({
  serveur: { type: String, required: true, index: true },
  paysAttaquant: { type: String, required: true, index: true },
  paysDefenseur: { type: String, required: true, index: true },
  date: { type: Date },
  staff: { type: [String], index: true },
  explosion: { type: [explosionSchema] },
  acte_illegal: { type: [String] },
  sent: { type: Boolean, required: true, index: true },
});

module.exports = GloryStaffConnection.model(
  "RecapitulatifAssaut",
  recapitulatifAssautSchema,
);
