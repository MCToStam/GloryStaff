const mongoose = require("mongoose");

const serveurDiscordSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  serveur: { type: String, required: true },
});

module.exports = mongoose.model("ServeurDiscord", serveurDiscordSchema);
