const mongoose = require("mongoose");

const { getGloryBotConnection } = require("../index");

const GloryBotConnection = getGloryBotConnection();

const fhomeCoordSchema = new mongoose.Schema(
  {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 },
  },
  { _id: false },
);

const newMemberSchema = new mongoose.Schema(
  {
    pseudo: String,
    playedTime: { type: Number, default: 0 },
    rewardPower: { type: Number, default: 0 },
    rewardPowerMax: { type: Number, default: 0 },
    rewardMoney: { type: Number, default: 0 },
    rewardMoneyMax: { type: Number, default: 0 },
    step: { type: Number, default: 0 },
  },
  { _id: false },
);

const bankSchema = new mongoose.Schema(
  {
    balance: { type: Number, default: 0 },
    owners: { type: [String], default: [] },
    members: { type: [String], default: [] },
  },
  { _id: false },
);

const actionDetailSchema = new mongoose.Schema(
  {
    owner: String,
    status: String,
  },
  { _id: false },
);

const dividendesClassementSchema = new mongoose.Schema(
  {
    pays: { type: String, default: "" },
    montant: { type: Number, default: 0 },
    timestamp: { type: Number, default: 0 },
  },
  { _id: false },
);

const dividendesHistorySchema = new mongoose.Schema(
  {
    pays: { type: String, default: "" },
    montant: { type: Number, default: 0 },
  },
  { _id: false },
);

const actionsSchema = new mongoose.Schema(
  {
    totalDividendes: { type: Number, default: 0 },
    availableActions: { type: Number, default: 0 },
    actionPrice: { type: Number, default: 0 },
    dividendesClassement: { type: [dividendesClassementSchema], default: [] },
    dividendesHistory: { type: [dividendesHistorySchema], default: [] },
    actions: { type: [actionDetailSchema], default: [] },
  },
  { _id: false },
);

const researchesLevelsSchema = new mongoose.Schema(
  {
    general: { type: Number, default: 0 },
    resource: { type: Number, default: 0 },
    military: { type: Number, default: 0 },
    industry: { type: Number, default: 0 },
    technology: { type: Number, default: 0 },
  },
  { _id: false },
);

const lastResearchSchema = new mongoose.Schema(
  {
    domain: String,
    level: Number,
    timestamp: Number,
  },
  { _id: false },
);

const recherchesEtDeveloppementSchema = new mongoose.Schema(
  {
    researchesLevels: { type: researchesLevelsSchema, default: {} },
    lastResearch: { type: lastResearchSchema, default: {} },
    researchesConditionsValues: {
      type: Object,
      default: {},
    },
  },
  { _id: false },
);

const coordDetailsSchema = new mongoose.Schema(
  {
    x: { type: [Number], default: [] },
    ytop: { type: Number, default: 0 },
    z: { type: [Number], default: [] },
  },
  { _id: false },
);

const zoneSchema = new mongoose.Schema(
  {
    x: { type: [Number], default: [] },
    z: { type: [Number], default: [] },
  },
  { _id: false },
);

const coordSchemaFull = new mongoose.Schema(
  {
    Terre: { type: [zoneSchema], default: [] },
    Lune: { type: [zoneSchema], default: [] },
    Mars: { type: [zoneSchema], default: [] },
    Edora: { type: [zoneSchema], default: [] },
  },
  { _id: false },
);

const settingsSchema = new mongoose.Schema(
  {
    invitationNeeded: { type: Boolean, default: false },
    recruitmentOpen: { type: Boolean, default: false },
    doKickRecruitWarReason: { type: Boolean, default: false },
    doKickMemberNegativePower: { type: Boolean, default: false },
  },
  { _id: false },
);

const assautDetailSchema = new mongoose.Schema(
  {
    date: Number,
    score: Number,
    resultat: String,
    duree: String,
    ennemi: String,
    aide_ennemi: [String],
    aide_allie: [String],
  },
  { _id: false },
);

const assautsSchema = new mongoose.Schema(
  {
    update: Number,
    total: Number,
    gagne: Number,
    perdu: Number,
    nul: Number,
    details: [assautDetailSchema],
  },
  { _id: false },
);

const paysSchema = new mongoose.Schema({
  server: { type: String, required: true, index: true },
  name: { type: String, required: true, index: true },
  description: { type: String, default: "" },
  motd: { type: String, default: "" },
  entryMsg: { type: String, default: "" },
  age: { type: Number, default: 0 },
  countMembers: { type: Number, default: 0 },
  countNewMembers: { type: Number, default: 0 },
  fhomeCoord: fhomeCoordSchema,
  level: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
  notationsPosition: { type: Number, default: 0 },
  isFullBuild: { type: Boolean, default: false },
  isUnderAbsence: { type: Boolean, default: false },
  tags: { type: [String], default: [] },
  discord: { type: String, default: "" },
  allianceName: { type: String, default: "" },
  inactiveOfficer: { type: Boolean, default: false },
  fhomeDate: { type: Date, default: null },
  mmr: { type: Number, default: 0 },
  claims: { type: Number, default: 0 },
  power: { type: Number, default: 0 },
  maxPower: { type: Number, default: 0 },
  powerboostFixed: { type: Number, default: 0 },
  powerboostWarzone: { type: Number, default: 0 },
  powerboostUnesco: { type: Number, default: 0 },
  powerboostNewMember: { type: Number, default: 0 },
  powerboostMalusAssault: { type: Number, default: 0 },
  flag: { type: String, default: "" },
  leader: { type: String, default: "" },
  officers: { type: [String], default: [] },
  members: { type: [String], default: [] },
  recruits: { type: [String], default: [] },
  newMembers: { type: [newMemberSchema], default: [] },
  wars: { type: [mongoose.Schema.Types.Mixed], default: [] },
  bank: { type: bankSchema, default: {} },
  actions: { type: actionsSchema, default: {} },
  settings: { type: settingsSchema, default: {} },
  topWarzone: { type: Boolean, default: false },
  restrictAssault: { type: Boolean, default: false },
  restrictMissile: { type: Boolean, default: false },
  empire: { type: Boolean, default: false },
  referent: { type: Boolean, default: false },
  allies: { type: [String], default: [] },
  enemies: { type: [String], default: [] },
  annexions: { type: [String], default: [] },
  update: { type: Number, default: Date.now },
  assauts: { type: assautsSchema, default: {} },
  recherche_et_developpement: {
    type: recherchesEtDeveloppementSchema,
    default: {},
  },
  coordonnee: { type: coordSchemaFull, default: {} },
});

module.exports = GloryBotConnection.model("Pays", paysSchema);
