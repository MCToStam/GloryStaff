const log = require("../../../util/module/log");
const { getData } = require("../../../util/module/getAndSaveData");
const { discordStaff } = require("../../../util/module/discordLink");
const getServerCommand = require("../../../util/getServerCommand");
const Serveur = require("../../../util/database/models/Serveur");
const config = require("../../../config");

module.exports = async (client, interaction) => {
  const slashCmd = client.container.slashCmds.get(interaction.commandName);
  if (!slashCmd) return;

  try {
    const { name, value } = interaction.options.getFocused(true);

    if (name === "joueur") {
      const sanitizedValue = value.trim().replace(/\s+/g, "");
      if (!sanitizedValue || sanitizedValue.length < 2) {
        await interaction.respond([]);
        return;
      }

      const res = await fetch(
        `https://apiv2.nationsglory.fr/forums/userSearch?search=${sanitizedValue}`,
      );
      const users = await res.json();

      const suggestions = users.slice(0, 25).map((user) => ({
        name: user.username,
        value: user.username,
      }));

      await interaction.respond(suggestions);
    } else if (name === "staff") {
      const serveur = await getServerCommand(
        interaction.guild.id,
        interaction.user.id,
      );

      if (serveur.length === 0) {
        return interaction.respond([
          {
            name: "Tu n'as pas le droit d'effectuer ceci !",
            value: "nopermission",
          },
        ]);
      }

      const staffOptions = [];

      for (const srv of serveur) {
        const staffServeur = await Serveur.findOne({
          serveur: srv,
        }).lean();

        for (const [grade, members] of Object.entries(staffServeur.staff)) {
          members.forEach((member) => {
            if (!member || member.trim() === "") return;

            staffOptions.push({
              name: `${serveur.length > 1 ? `[${srv.toUpperCase()}] ` : ""}${config.grade[grade].nom.normal} : ${member}`,
              value: member,
            });
          });
        }
      }

      const filteredOptions = staffOptions.filter((option) =>
        option.name.toLowerCase().includes(value.toLowerCase()),
      );

      return interaction.respond(filteredOptions.slice(0, 25));
    } else if (name === "paysa" || name === "paysb") {
      const serveur = await getServerCommand(
        interaction.guild.id,
        interaction.user.id,
      );

      if (serveur.length === 0) {
        return interaction.respond([
          {
            name: "Tu n'as pas le droit d'effectuer ceci !",
            value: "nopermission",
          },
        ]);
      }

      const paysRes = await fetch(
        `${config.glorybot_url}/api/paysCree?serveur=${serveur[0]}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${config.glorybot_token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const paysData = await paysRes.json();

      const filteredCountries = paysData
        .filter((p) => p.toLowerCase().startsWith(value.toLowerCase()))
        .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

      const choices = filteredCountries
        .slice(0, 25)
        .map((p) => ({ name: p, value: p }));

      await interaction.respond(choices);
    } else if (name === "criminel") {
      const sanitizedValue = value.trim().replace(/\s+/g, "");
      if (!sanitizedValue) {
        await interaction.respond([]);
        return;
      }

      if (sanitizedValue && sanitizedValue.length > 0) {
        const res = await fetch(
          `https://apiv2.nationsglory.fr/forums/userSearch?search=${sanitizedValue}`,
        );
        const users = await res.json();

        const suggestions = users.slice(0, 25).map((user) => ({
          name: user.username,
          value: user.username,
        }));

        await interaction.respond(suggestions);
      }
    } else if (name === "grade") {
      const serveur = await getServerCommand(
        interaction.guild.id,
        interaction.user.id,
      );

      if (serveur.length === 0) {
        return interaction.respond([
          {
            name: "Tu n'as pas le droit d'effectuer ceci !",
            value: "nopermission",
          },
        ]);
      }

      const gradeData = getData(`data/${serveur[0]}/grade.json`);

      const allGrades = gradeData.grade.map((g) => {
        const categorie = gradeData.categorie.find((c) => c.id === g.categorie);
        return {
          id: g.id,
          nom: g.nom,
          categorieId: g.categorie,
          categorieNom: categorie ? categorie.nom : "Autre",
        };
      });

      const filteredGrades = allGrades.filter(
        (g) =>
          g.nom.toLowerCase().startsWith(value.toLowerCase()) ||
          g.categorieNom.toLowerCase().startsWith(value.toLowerCase()),
      );

      const choices = filteredGrades.slice(0, 25).map((g) => ({
        name: `${g.categorieNom} : ${g.nom}`,
        value: `${g.categorieId}_${g.id}`,
      }));

      await interaction.respond(choices);
    } else if (name === "sanction") {
      const sanctionsData = getData("data/sanctionsCache.json");
      const sanctions = sanctionsData.sanctions
        .filter((s) => s.name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 25)
        .map((s) => ({
          name: s.name,
          value: s.technicalName,
        }));
      await interaction.respond(sanctions);
    }
  } catch (e) {
    await interaction.respond([]);
    log(e, "error", "red");
  }
};
