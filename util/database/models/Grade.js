const mongoose = require("mongoose");

const { getGloryStaffConnection } = require("../index");

const GloryStaffConnection = getGloryStaffConnection();

const gradeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    nom: { type: String, required: true },
    couleur: { type: String, required: true },
    subtitle_rank: { type: String, required: true },
    subtitle_derank: { type: String, required: true },
    role: { type: [String], default: [] },
  },
  { _id: false },
);

const categorieSchema = new mongoose.Schema({
  id: { type: String, required: true },
  nom: { type: String, required: true },
  role: { type: [String], default: [] },
  grade: { type: [gradeSchema], default: [] },
});

const configSchema = new mongoose.Schema({
  serveur: { type: String, required: true, unique: true },
  categorie: { type: [categorieSchema], default: [] },
});

module.exports = GloryStaffConnection.model("Grade", configSchema);
