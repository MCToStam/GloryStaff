const mongoose = require("mongoose");

const { getGloryStaffConnection } = require("../index");

const GloryStaffConnection = getGloryStaffConnection();

const sessionSchema = new mongoose.Schema({
  start: { type: Date },
  end: { type: Date },
});

const activiteDiscordSchema = new mongoose.Schema({
  pseudo: { type: String, required: true, index: true },
  serveur: { type: String, required: true, index: true },
  session: { type: [sessionSchema] },
});

module.exports = GloryStaffConnection.model(
  "ActiviteDiscord",
  activiteDiscordSchema,
);
