const fs = require("fs");
const path = require("path");
const config = require("../config");

const AUTRE_EMOJI = {
  Guide: "<:guide:1441505228007411783>",
  Modérateur: "<:moderateur:1441505230394228897>",
  Builder: "<:builder:1458468397963808872>",
  "Pays Pillable ( 14h )": false,
  "Pays Disband ( 18h15 )": false,
  doublelead: "<:doublelead:1458459662851637554>",
  "Full Build": false,
  "Conquête Territoriale": false,
  Plainte: false,
  Guerre: false,
  "Plainte non traitée": false,
  "Guerre non traitée": false,
  jail: "<:jail:1441734907260043264>",
  Classement: false,
  Répartition: false,
  Alerte: false,
  "Rappel 1": false,
  "Rappel 2": false,
  "Rappel 3": false,
  "Récapitulatif Hebdomadaire": false,
  "Récapitulatif Mensuel": false,
  routine: "<:routine:1441734905980649695>",
  "Affichage Staff": false,
  "Sanction Staff": false,
  joueurconnecte: "<:joueursconnectes:1458459673974800589>",
};
const SYSTEMES_CONFIG = {
  attentestaff: {
    nom: "Attente Staff",
    emoji: "<:attentestaff:1458459659043078154>",
    permission: "guide",
  },
  candidature: {
    nom: "Candidature",
    emoji: "<:candidature:1458459660343447735>",
    permission: "guide",
  },
  disband: {
    nom: "Disband",
    emoji: "<:disband:1458459661782220892>",
    permission: "guide",
  },
  doublelead: {
    nom: "Double Lead",
    emoji: "<:doublelead:1458459662851637554>",
    permission: "super_moderateur",
  },
  expansionterritoriale: {
    nom: "Expansion Territoriale",
    emoji: "<:expantionterritoriale:1458459664768303268>",
    permission: "super_moderateur",
  },
  forum: {
    nom: "Forum",
    emoji: "<:forum:1458459666282582170>",
    permission: "moderateur_test",
  },
  jail: {
    nom: "Jail",
    emoji: "<:jail:1441734907260043264>",
    permission: "moderateur_test",
  },
  notation: {
    nom: "Notations",
    emoji: "<:notations:1458460474017321204>",
    permission: "guide",
  },
  onu: {
    nom: "ONU",
    emoji: "<:onu:1458459668165824543>",
    permission: "guide",
  },
  recap: {
    nom: "Récapitulatif",
    emoji: "<:recapitulatif:1458459670346858683>",
    permission: "guide",
  },
  routine: {
    nom: "Routine",
    emoji: "<:routine:1441734905980649695>",
    permission: "moderateur_plus",
  },
  staff: {
    nom: "Staff",
    emoji: "<:gestionstaff:1458459672058265610>",
    permission: "super_moderateur",
  },
  joueurconnecte: {
    nom: "Joueur(s) Connecté(s)",
    emoji: "<:joueursconnectes:1458459673974800589>",
    permission: "guide",
  },
};

function nettoyerValeurs(obj, client) {
  if (typeof obj !== "object" || obj === null) return obj;

  if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] === "string") {
      const firstId = obj[0];
      const role = client.guilds.cache
        .map((g) => g.roles.cache.get(firstId))
        .find((r) => r);
      if (role) {
        return { valeur: { [role.guild.id]: obj } };
      } else {
        return { valeur: {} };
      }
    }
    return obj;
  }

  const resultat = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key === "valeur") {
      if (value === false) {
        resultat[key] = {};
      } else if (
        Array.isArray(value) &&
        (value.length === 0 || (value.length === 1 && value[0] === false))
      ) {
        resultat[key] = {};
      } else if (typeof value === "string") {
        const channel = client.channels.cache.get(value);
        if (channel) {
          resultat[key] = { [channel.guild.id]: value };
        } else {
          resultat[key] = {};
        }
      } else if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === "string") {
          const role = client.guilds.cache
            .map((g) => g.roles.cache.get(value[0]))
            .find((r) => r);
          if (role) {
            resultat[key] = { [role.guild.id]: value };
          } else {
            resultat[key] = {};
          }
        } else {
          resultat[key] = value;
        }
      } else {
        resultat[key] = value;
      }
    } else if (typeof value === "object" && value !== null) {
      resultat[key] = nettoyerValeurs(value, client);
    } else {
      resultat[key] = value;
    }
  }

  return resultat;
}

function genererConfigsServeurs(client) {
  for (const serveur of config.liste_serveur) {
    const dossierServeur = path.join(__dirname, "..", "data", serveur);
    const resultat = [];

    if (!fs.existsSync(dossierServeur)) continue;

    const fichiersConfig = fs
      .readdirSync(dossierServeur)
      .filter((f) => f.startsWith("config-") && f.endsWith(".json"));

    for (const fichier of fichiersConfig) {
      const cheminFichier = path.join(dossierServeur, fichier);
      const nomSysteme = fichier.replace("config-", "").replace(".json", "");
      if (
        nomSysteme === "radio" ||
        nomSysteme === "role" ||
        nomSysteme === "changelogs"
      )
        continue;

      try {
        const contenuBrut = JSON.parse(fs.readFileSync(cheminFichier, "utf8"));
        const configManuelle = SYSTEMES_CONFIG[nomSysteme];

        const contenuFinal = {};

        for (const [systeme, data] of Object.entries(contenuBrut)) {
          const nettoye = nettoyerValeurs(data, client);

          let active = {};

          function trouverServeur(obj) {
            if (typeof obj !== "object" || obj === null) return null;

            if (
              obj.valeur &&
              typeof obj.valeur === "object" &&
              !Array.isArray(obj.valeur)
            ) {
              const serveurId = Object.keys(obj.valeur)[0];
              if (serveurId) return serveurId;
            }

            for (const val of Object.values(obj)) {
              if (typeof val === "object") {
                const res = trouverServeur(val);
                if (res) return res;
              }
            }
            return null;
          }

          const serveurId = trouverServeur(nettoye);
          if (serveurId) {
            active[serveurId] = data.active ?? false;
          }

          if (
            data.donnee &&
            typeof data.donnee === "object" &&
            Object.keys(data.donnee).length > 0
          ) {
            data.donnee = { [serveurId]: data.donnee };
          }

          let vraiSysteme = systeme;
          if (systeme === "classement") vraiSysteme = "Classement";
          if (systeme === "répartition") vraiSysteme = "Répartition";

          contenuFinal[vraiSysteme] = {
            emoji: AUTRE_EMOJI[systeme] || false,
            ...nettoye,
            active,
          };
        }

        resultat.push({
          nom: configManuelle?.nom || false,
          emoji: configManuelle?.emoji || false,
          permission: configManuelle?.permission || false,
          systeme: contenuFinal,
        });
      } catch (err) {
        console.error(`Erreur lecture ${cheminFichier}`, err);
      }
    }

    fs.writeFileSync(
      path.join(dossierServeur, "config.json"),
      JSON.stringify(resultat, null, 2),
      "utf8",
    );

    console.log(`[${serveur}] config.json généré`);
  }
}

module.exports = genererConfigsServeurs;
