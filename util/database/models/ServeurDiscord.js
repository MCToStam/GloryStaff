const mongoose = require("mongoose");

const { getGloryStaffConnection } = require("../index");

const GloryStaffConnection = getGloryStaffConnection();

const serveurDiscordSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  serveur: { type: String, required: true },
});

module.exports = GloryStaffConnection.model(
  "ServeurDiscord",
  serveurDiscordSchema,
);
