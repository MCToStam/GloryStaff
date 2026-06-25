const mongoose = require("mongoose");
const log = require("../../util/module/log");

const GLOBAL_KEY = "__mongo_cache__";

let cached = global[GLOBAL_KEY];

if (!cached) {
  cached = global[GLOBAL_KEY] = {
    gloryProjects: null,
    gloryBot: null,
    gloryStaff: null,
    promise: null,
  };
}

const GloryProjectsConnection =
  cached.gloryProjects ||
  mongoose.createConnection(process.env.MONGO_URI_GLORYPROJECTS);
const GloryBotConnection =
  cached.gloryBot || mongoose.createConnection(process.env.MONGO_URI_GLORYBOT);
const GloryStaffConnection =
  cached.gloryStaff ||
  mongoose.createConnection(process.env.MONGO_URI_GLORYSTAFF);

async function connectMongo() {
  if (cached.promise) return cached.promise;

  cached.promise = Promise.all([
    GloryProjectsConnection.asPromise(),
    GloryBotConnection.asPromise(),
    GloryStaffConnection.asPromise(),
  ])
    .then(() => {
      cached.gloryProjects = GloryProjectsConnection;
      cached.gloryBot = GloryBotConnection;
      cached.gloryStaff = GloryStaffConnection;

      log("MongoDB est correctement connecté", "READY", "green");
    })
    .catch((err) => {
      log(`❌ Erreur lors de MongoDB : ${err}`, "error", "red");
    });

  return cached.promise;
}

module.exports = {
  connectMongo,
  getGloryProjectsConnection: () => GloryProjectsConnection,
  getGloryBotConnection: () => GloryBotConnection,
  getGloryStaffConnection: () => GloryStaffConnection,
};
