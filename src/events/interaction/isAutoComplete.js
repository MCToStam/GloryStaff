const log = require("../../../util/module/log");
const { getData } = require("../../../util/module/getAndSaveData");
const config = require("../../../config");

module.exports = async (client, interaction) => {
  const slashCmd = client.container.slashCmds.get(interaction.commandName);
  if (!slashCmd) return;

  try {
    const { name, value } = interaction.options.getFocused(true);

    if (name === "serveur") {
      try {
        const now = Date.now();
        const serveurCache = new Map();
        const memberId = interaction.user.id;

        if (serveurCache.has(memberId)) {
          const { timestamp, servers } = serveurCache.get(memberId);
          if (now - timestamp < 10 * 60 * 1000) {
            const filteredServers = config.liste_serveur.filter((server) =>
              server.toLowerCase().startsWith(value.toLowerCase()),
            );
            const choices = filteredServers.slice(0, 25).map((server) => ({
              name: server.charAt(0).toUpperCase() + server.slice(1),
              value: server,
            }));
            return await interaction.respond(choices);
          } else {
            serveurCache.delete(memberId);
          }
        }

        let availableServers = [];

        let pseudo;
        try {
          const response = await fetch(
            `${config.glorybot_url}/api/get-ng?discordId=${interaction.user.id}`,
          );
          if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
          const data = await response.json();

          pseudo = data.pseudo || null;
        } catch (e) {
          pseudo = null;
        }

        const isDev = memberId === config.developpeur;

        const matchedServers = config.liste_serveur.filter((server) =>
          server.toLowerCase().startsWith(value.toLowerCase()),
        );

        for (const server of matchedServers) {
          const staffData = getData(`data/${server}/staff.json`);

          const isStaff = Object.values(staffData).some((roleMembers) =>
            roleMembers.includes(memberId),
          );

          if (isStaff || isDev) {
            availableServers.push(server);
          } else if (pseudo) {
            const staffRolesData = getData(`data/${server}/staff-serveur.json`);

            const isStaffLinked = Object.entries(staffRolesData).some(
              ([key, roleList]) =>
                Array.isArray(roleList) && roleList.includes(pseudo),
            );

            if (isStaffLinked) {
              availableServers.push(server);
            }
          }
        }

        if (availableServers.length === 0) {
          if (!pseudo) {
            return await interaction.respond([
              {
                name: "Compte NationsGlory non lié, fait le maintenant : https://glorybot.fr",
                value: "non-lie",
              },
            ]);
          } else {
            return await interaction.respond([
              {
                name: "Vous n'êtes staff d'aucun serveur de NationsGlory.",
                value: "permission",
              },
            ]);
          }
        } else {
          serveurCache.set(memberId, {
            timestamp: now,
            servers: availableServers,
          });
        }

        const filteredServers = availableServers.filter((server) =>
          server.toLowerCase().startsWith(value.toLowerCase()),
        );

        const choices = filteredServers.slice(0, 25).map((server) => ({
          name: server.charAt(0).toUpperCase() + server.slice(1),
          value: server,
        }));

        await interaction.respond(choices);
      } catch (error) {
        console.error(
          "Erreur lors de la gestion de l'autocomplétion pour les serveurs :",
          error,
        );
        await interaction.respond([]);
      }
    } else if (name === "grade") {
      try {
        const serveur = interaction.options.getString("serveur");

        if (!serveur) {
          return await interaction.respond([
            {
              name: "Il te faut sélectionner un serveur",
              value: "non-choisit",
            },
          ]);
        }

        if (serveur === "non-lie") {
          return await interaction.respond([
            {
              name: "Compte NationsGlory non lié, fait le maintenant : https://glorybot.fr",
              value: "non-lie",
            },
          ]);
        }

        const gradeData = getData(`data/${serveur}/grade.json`);

        const allGrades = gradeData.grade.map((g) => {
          const categorie = gradeData.categorie.find(
            (c) => c.id === g.categorie,
          );
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
      } catch (error) {
        console.error("Erreur lors de l'autocomplétion pour grade :", error);
        await interaction.respond([]);
      }
    } else if (name === "role") {
      try {
        const serveur = interaction.options.getString("serveur");
        const memberId = interaction.user.id;

        if (!serveur) {
          return await interaction.respond([
            {
              name: "Il te faut sélectionner un serveur",
              value: "non-choisit",
            },
          ]);
        }

        if (serveur === "non-lie") {
          return await interaction.respond([
            {
              name: "Compte NationsGlory non lié, fait le maintenant : https://glorybot.fr",
              value: "non-lie",
            },
          ]);
        }

        if (memberId === config.developpeur) {
          const grades = ["Administrateur", "Super-Modérateur", "Joueur"];

          const filteredGrades = grades.filter((grade) =>
            grade.toLowerCase().startsWith(value.toLowerCase()),
          );

          const choices = filteredGrades.slice(0, 25).map((grade) => ({
            name: grade,
            value: grade,
          }));

          return interaction.respond(choices);
        }

        const staffData = getData(`data/${serveur}/staff.json`);

        const isAdmin = staffData["Administrateur"]?.includes(
          interaction.user.id,
        );

        if (!isAdmin) {
          return interaction.respond([
            {
              name: "Tu n'as pas la permission de donner des grades",
              value: "nopermission",
            },
          ]);
        }

        const grades = ["Administrateur", "Super-Modérateur", "Joueur"];

        const filteredGrades = grades.filter((grade) =>
          grade.toLowerCase().startsWith(value.toLowerCase()),
        );

        const choices = filteredGrades.slice(0, 25).map((grade) => ({
          name: grade,
          value: grade,
        }));

        await interaction.respond(choices);
      } catch (error) {
        console.error(
          "Erreur lors de la gestion de l'autocomplétion pour les grades :",
          error,
        );
        await interaction.respond([]);
      }
    } else if (name === "joueur") {
      const sanitizedValue = value.trim().replace(/\s+/g, "");
      if (!sanitizedValue || sanitizedValue.length < 2) {
        await interaction.respond([]);
        return;
      }

      try {
        const res = await fetch(
          `https://apiv2.nationsglory.fr/forums/userSearch?search=${sanitizedValue}`,
        );
        const users = await res.json();

        const suggestions = users.slice(0, 25).map((user) => ({
          name: user.username,
          value: user.username,
        }));

        await interaction.respond(suggestions);
      } catch (error) {
        await interaction.respond([]);
        console.log(error);
      }
    } else if (name === "staff") {
      const serveur = interaction.options.getString("serveur");

      if (!serveur) {
        return await interaction.respond([
          {
            name: "Il te faut sélectionner un serveur",
            value: "non-choisit",
          },
        ]);
      }

      const staffData = getData(`data/${serveur}/staff.json`);

      const isAdmin = staffData["Administrateur"]?.includes(
        interaction.user.id,
      );
      const isSM = staffData["Super-Modérateur"]?.includes(interaction.user.id);

      if (!isAdmin && !isSM && interaction.user.id != config.developpeur) {
        return interaction.respond([
          {
            name: "Tu n'effectuer n'a pas le droit d'effectuer ceci !",
            value: "nopermission",
          },
        ]);
      }

      const fullStaffData = getData(`data/${serveur}/staff-serveur.json`);

      const staffOptions = [];
      for (const [grade, members] of Object.entries(fullStaffData)) {
        if (!Array.isArray(members)) continue;
        members.forEach((member) => {
          if (member && member.trim() !== "") {
            staffOptions.push({
              name: `${grade} : ${member}`,
              value: member,
            });
          }
        });
      }

      const filteredOptions = staffOptions.filter((option) =>
        option.value.toLowerCase().startsWith(value.toLowerCase()),
      );

      const limitedOptions = filteredOptions.slice(0, 25);

      return interaction.respond(limitedOptions);
    } else if (name === "pays-a" || name === "pays-b") {
      const serveur = interaction.options.getString("serveur");

      if (!serveur || !config.liste_serveur.includes(serveur)) {
        return await interaction.respond([
          {
            name: "Il te faut sélectionner un serveur",
            value: "non-choisit",
          },
        ]);
      }

      try {
        const paysRes = await fetch(
          `${config.glorybot_url}/api/paysCree?serveur=${serveur}`,
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
      } catch (error) {
        console.error("Erreur lors de la gestion de l'autocomplétion", error);
        await interaction.respond([]);
      }
    } else if (name === "criminel") {
      const sanitizedValue = value.trim().replace(/\s+/g, "");
      if (!sanitizedValue) {
        await interaction.respond([]);
        return;
      }
      try {
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
      } catch (error) {}
    } else if (name === "mois") {
      let moisDisponibles = new Set();
      const salaires = getData(`data/black/avocat/salaire.json`);

      salaires.forEach((utilisateur) => {
        Object.keys(utilisateur.salaire).forEach((mois) =>
          moisDisponibles.add(mois),
        );
      });

      const suggestions = [...moisDisponibles]
        .filter((mois) => mois.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 25)
        .map((mois) => ({ name: mois, value: mois }));

      await interaction.respond(suggestions);
    }
  } catch (e) {
    await interaction.respond([]);
    log(e, "error", "red");
  }
};
