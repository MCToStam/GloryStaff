const log = require("../../../util/module/log");
const { getData } = require("../../../util/module/getAndSaveData");
const getServerCommand = require("../../../util/getServerCommand");
const Serveur = require("../../../util/database/models/Serveur");
const Grade = require("../../../util/database/models/Grade");
const Evenement = require("../../../util/database/models/Evenement");
const config = require("../../../config");

const fetchJSON = async (url, options) => {
  const res = await fetch(url, options);
  return res.json();
};

const respond = (interaction, data = []) =>
  interaction.respond(data).catch(() => {});

const sanitize = (v) => v.trim().replace(/\s+/g, "");

module.exports = async (client, interaction) => {
  const slashCmd = client.container.slashCmds.get(interaction.commandName);
  if (!slashCmd) return;

  try {
    const { name, value } = interaction.options.getFocused(true);
    const query = (value || "").toLowerCase();

    const serveurs = async () =>
      getServerCommand(interaction.guild.id, interaction.user.id);

    if (name === "joueur" || name === "criminel") {
      const sanitized = sanitize(value || "");
      if (sanitized.length < 2) return respond(interaction);

      const users = await fetchJSON(
        `https://apiv2.nationsglory.fr/forums/userSearch?search=${sanitized}`,
      );

      return respond(
        interaction,
        users.slice(0, 25).map((u) => ({
          name: u.username,
          value: u.username,
        })),
      );
    }

    if (name === "staff") {
      const srvList = await serveurs();
      if (!srvList.length) {
        return respond(interaction, [
          {
            name: "Tu n'as pas le droit d'effectuer ceci !",
            value: "nopermission",
          },
        ]);
      }

      const staffOptions = await Promise.all(
        srvList.map(async (srv) => {
          const data = await Serveur.findOne({ serveur: srv }).lean();
          if (!data?.staff) return [];

          return Object.entries(data.staff).flatMap(([grade, members]) =>
            (members || []).filter(Boolean).map((member) => ({
              name: `${srvList.length > 1 ? `[${srv.toUpperCase()}] ` : ""}${
                config.grade?.[grade]?.nom?.normal || grade
              } : ${member}`,
              value: member,
            })),
          );
        }),
      );

      const flat = staffOptions.flat();

      return respond(
        interaction,
        flat.filter((o) => o.name.toLowerCase().includes(query)).slice(0, 25),
      );
    }

    if (
      name === "paysa" ||
      name === "paysb" ||
      name === "pays_attaquant" ||
      name === "pays_defenseur"
    ) {
      const srvList = await serveurs();
      if (!srvList.length) {
        return respond(interaction, [
          {
            name: "Tu n'as pas le droit d'effectuer ceci !",
            value: "nopermission",
          },
        ]);
      }

      const paysData = await fetchJSON(
        `${config.glorybot_url}/api/paysCree?serveur=${srvList[0]}`,
        {
          headers: {
            Authorization: `Bearer ${config.glorybot_token}`,
          },
        },
      );

      return respond(
        interaction,
        paysData
          .filter((p) => p.toLowerCase().startsWith(query))
          .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }))
          .slice(0, 25)
          .map((p) => ({ name: p, value: p })),
      );
    }

    if (name === "grade") {
      const srvList = await serveurs();
      if (!srvList.length) {
        return respond(interaction, [
          {
            name: "Tu n'as pas le droit d'effectuer ceci !",
            value: "nopermission",
          },
        ]);
      }

      const docs = await Grade.find({ serveur: { $in: srvList } });

      const allGrades = docs.flatMap((doc) =>
        doc.categorie.flatMap((cat) =>
          cat.grade.map((g) => ({
            id: g.id,
            nom: g.nom,
            catId: cat.id,
            catNom: cat.nom,
            serveur: doc.serveur,
          })),
        ),
      );

      return respond(
        interaction,
        allGrades
          .filter(
            (g) =>
              g.nom.toLowerCase().startsWith(query) ||
              g.catNom.toLowerCase().startsWith(query),
          )
          .slice(0, 25)
          .map((g) => ({
            name:
              srvList.length > 1
                ? `[${g.serveur.toUpperCase()}] ${g.catNom} : ${g.nom}`
                : `${g.catNom} : ${g.nom}`,
            value: `${g.catId}_${g.id}`,
          })),
      );
    }

    if (name === "evenement") {
      const srvList = await serveurs();
      if (!srvList.length) {
        return respond(interaction, [
          {
            name: "Tu n'as pas le droit d'effectuer ceci !",
            value: "nopermission",
          },
        ]);
      }

      const events = await Evenement.find({ serveur: { $in: srvList } });

      return respond(
        interaction,
        events
          .filter((event) => event.nom.toLowerCase().startsWith(query))
          .slice(0, 25)
          .map((event) => ({
            name:
              srvList.length > 1
                ? `[${event.serveur.toUpperCase()}] ${event.nom}`
                : event.nom,
            value: event.nom,
          })),
      );
    }

    if (name === "sanction") {
      const sanctions = getData("data/sanctionsCache.json");

      return respond(
        interaction,
        sanctions.sanctions
          .filter((s) => s.name.toLowerCase().includes(query))
          .slice(0, 25)
          .map((s) => ({
            name: s.name,
            value: s.technicalName,
          })),
      );
    }
  } catch (e) {
    log(e, "error", "red");
    await interaction.respond([]).catch(() => {});
  }
};
