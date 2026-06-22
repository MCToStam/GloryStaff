const mongoose = require("mongoose");

const { getGloryBotConnection } = require("../index");

const GloryBotConnection = getGloryBotConnection();

const linkSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true,
    default: "",
    index: true,
  },
  pseudoNg: {
    type: [String],
    default: [],
    index: true,
  },
});

module.exports = GloryBotConnection.model("Link", linkSchema);
