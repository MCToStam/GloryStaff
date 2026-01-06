const { getData } = require("../../../../util/module/getAndSaveData");
const { ContainerBuilder, MessageFlags } = require("discord.js");

module.exports = {
  data: {
    name: "dossierDisbandDetails",
  },

  async execute(client, interaction, config) {
    const value = interaction.values[0];
    const match = value.match(/^dossierDisbandDetails-(.+?)-(.+)$/);

    const serveur = match[1];
    const pays = decodeURIComponent(match[2]);

    const data = getData(`data/${serveur}/dossierDisband.json`);

    const entry = data.find((e) => {
      const nom = e.rapport?.informations?.nom_pays || e.pays;
      return nom.toLowerCase() === pays.toLowerCase();
    });

    if (!entry) {
      return interaction.reply({
        content: `Le pays **${pays}** n'a pas été trouvé.`,
        ephemeral: true,
      });
    }

    const r = entry.rapport;

    let changementChefDetails = "";

    if (
      Array.isArray(r.activite.changement_chef_30d) &&
      r.activite.changement_chef_30d.length > 0
    ) {
      const now = Date.now();
      const thirtyOneDays = 31 * 24 * 60 * 60 * 1000;

      const changements = r.activite.changement_chef_30d
        .filter((c) => now - c.date * 1000 <= thirtyOneDays)
        .map((c) => {
          const date = new Date(c.date * 1000);
          const dateFormat = new Intl.DateTimeFormat("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }).format(date);

          return `${dateFormat} : ${c.ancien} → ${c.nouveau}`;
        });

      changementChefDetails =
        changements.length > 0 ? changements.join(", ") : "Non";
    } else {
      changementChefDetails = "Non";
    }

    const nbGuerres = r.pvp.nb_guerres;
    const guerresDetails =
      Array.isArray(r.pvp.nb_guerres) && r.pvp.nb_guerres.length
        ? `(${r.pvp.nb_guerres.join(", ")})`
        : "";

    const nbAssauts = Array.isArray(r.pvp.nb_assauts_30d)
      ? r.pvp.nb_assauts_30d.length
      : 0;
    let assautsDetails = "";
    if (nbAssauts > 0) {
      const victoires =
        r.pvp.nb_assauts_30d.filter((a) => a.resultat === "victoire").length ||
        0;
      const defaites =
        r.pvp.nb_assauts_30d.filter((a) => a.resultat === "défaite").length ||
        0;
      const nuls =
        r.pvp.nb_assauts_30d.filter((a) => a.resultat === "nul").length || 0;
      assautsDetails = `(${victoires} victoire${
        victoires !== 1 ? "s" : ""
      }, ${defaites} défaite${defaites !== 1 ? "s" : ""}, ${nuls} nul${
        nuls !== 1 ? "s" : ""
      })`;
    }

    const dateRecherche = r.recherche.derniere_recherche_30d
      ? new Date(r.recherche.derniere_recherche_30d)
      : null;

    const dateFormatee = dateRecherche
      ? new Intl.DateTimeFormat("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
          .format(dateRecherche)
          .replace(",", " à")
      : "Aucune recherche";

    const codeContent = `\`\`\`
**[INFORMATIONS]**

Nom du Pays : ${r.informations.nom_pays}
Chef du Pays : ${r.informations.chef}
Motif du Disband : ${r.informations.motif}


**[ACTIVITÉ]**

Absences en Cours (Chef ou Officiers) : ${
      r.activite.absences_chef_ou_officiers
        ? r.activite.absences_chef_ou_officiers
        : ""
    }
Changement de Chef {-30d} : ${changementChefDetails}
Nb d'invitations à des joueurs différents {-30d} : ${
      r.activite.invitations_joueurs_30d
        ? r.activite.invitations_joueurs_30d
        : ""
    }


**[COMMERCE]**

Quelles sont les transactions bancaires (hors dépôt et retrait des notations) {-30d} : ${
      r.commerce.transactions_30d ? r.commerce.transactions_30d : ""
    }
Nb de location de parcelles (visibles dans les transactions bancaires) {-30d} : ${
      r.commerce.locations_parcelles_30d
        ? r.commerce.locations_parcelles_30d
        : ""
    }


**[R&D]**

Date du lancement de la dernière recherche {-30d} : ${dateFormatee}


**[PvP]**

Nb de guerres : ${nbGuerres} ${guerresDetails ? guerresDetails : ""}
Nb de guerres débutées (consultable au /wars list) {-30d} : ${
      r.pvp.nb_guerres_30d ? r.pvp.nb_guerres_30d : ""
    }
Nb de demandes de guerres en suspens : ${
      r.pvp.demandes_guerres_suspens ? r.pvp.demandes_guerres_suspens : ""
    }
Nb d'assauts {-30d} : ${nbAssauts} ${assautsDetails ? assautsDetails : ""}
Nb Powerboost WarZone : ${r.pvp.nb_powerboost_wz ? r.pvp.nb_powerboost_wz : ""}


**[BUILD]**

De quand date le dernier build (même ridicule) : ${
      r.build.dernier_build ? r.build.dernier_build : ""
    }
Quel était la nature du build (1 arbre, 1 maison, terraforming etc.) : ${
      r.build.nature_build ? r.build.nature_build : ""
    }


**[SCREENSHOTS]**

Screen du coffre de pays : ${
      r.screenshots.coffre_pays ? r.screenshots.coffre_pays : ""
    }
Panneau prévention (screen des logs) : ${
      r.screenshots.panneau_prevention ? r.screenshots.panneau_prevention : ""
    }
\`\`\``;

    const container = new ContainerBuilder()
      .setAccentColor(config.color)
      .addTextDisplayComponents((t) => t.setContent(codeContent));

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
