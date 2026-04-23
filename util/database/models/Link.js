const mongoose = require("mongoose");

const { getGloryBotConnection } = require("../index");

const GloryBotConnection = getGloryBotConnection();

const linkSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true,
    default: "",
  },
  pseudoNg: {
    type: Array,
    default: [],
  },
});

module.exports = GloryBotConnection.model("Link", linkSchema);
