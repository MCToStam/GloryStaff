const mongoose = require("mongoose");

const { getGloryBotConnection } = require("../index");

const GloryBotConnection = getGloryBotConnection();

const serveurSchema = new mongoose.Schema({
  serveur: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  description: { type: String, default: "" },
  banniere: { type: String, default: "" },
  dateCreation: { type: Date, default: null },
  paysCrees: { type: Array, default: [] },
  paysDisponibles: { type: Array, default: [] },
  reseau: {
    type: {
      discord: { type: String, default: "" },
      youtube: { type: String, default: "" },
      x: { type: String, default: "" },
      _id: false,
    },
    default: {},
  },
  forum: {
    type: {
      journal: { type: String, default: "" },
      resumeonu: {
        type: {
          categorie: { type: String, default: "" },
          posts: { type: Array, default: [] },
          _id: false,
        },
        default: {},
      },
      _id: false,
    },
  },
  ressource: {
    type: Array,
    default: [],
    _id: false,
  },
  staff: {
    type: {
      administrateur: { type: Array, default: [] },
      super_moderateur: { type: Array, default: [] },
      moderateur_plus: { type: Array, default: [] },
      moderateur: { type: Array, default: [] },
      moderateur_test: { type: Array, default: [] },
      guide: { type: Array, default: [] },
      _id: false,
    },
    default: {},
  },
});

module.exports = GloryBotConnection.model("Serveur", serveurSchema);
