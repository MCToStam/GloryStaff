const fs = require("fs");
const path = require("path");
const config = require("../config");

const AUTRE_EMOJI = {};
const SYSTEMES_CONFIG = {
  attentestaff: {
    nom: "Attente Staff",
    emoji: false,
    permission: "guide",
  },
  candidature: {
    nom: "Candidature",
    emoji: false,
    permission: "guide",
  },
  disband: {
    nom: "Disband",
    emoji: false,
    permission: "guide",
  },
  doublelead: {
    nom: "Double Lead",
    emoji: false,
    permission: "super_moderateur",
  },
  expansionterritoriale: {
    nom: "Expansion Territoriale",
    emoji: false,
    permission: "super_moderateur",
  },
  forum: {
    nom: "Forum",
    emoji: false,
    permission: "moderateur_test",
  },
  jail: {
    nom: "Jail",
    emoji: false,
    permission: "moderateur_test",
  },
  notation: {
    nom: "Notations",
    emoji: false,
    permission: "guide",
  },
  onu: {
    nom: "ONU",
    emoji: false,
    permission: "guide",
  },
  recap: {
    nom: "Récapitulatif",
    emoji: false,
    permission: "guide",
  },
  routine: {
    nom: "Routine",
    emoji: false,
    permission: "moderateur_plus",
  },
  staff: {
    nom: "Staff",
    emoji: false,
    permission: "super_moderateur",
  },
  joueurconnecte: {
    nom: "Joueur(s) Connecté(s)",
    emoji: false,
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

          contenuFinal[systeme] = {
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
