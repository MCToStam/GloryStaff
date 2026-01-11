const config = require("../config");
const {
  getData,
  saveData,
  getFiles,
} = require("../util/module/getAndSaveData");

const INFO_SUPP = {
  "Attente Staff":
    "Ce système permet d'être alerté lorsqu'une personne rejoint le salon \"Attente Staff\" de votre serveur.",
  Guide:
    "Ce système vous permet d'être alerté lorsqu'une nouvelle candidature pour le poste de guide est envoyée sur le forum.",
  Modérateur:
    "Ce système vous permet d'être alerté lorsqu'une nouvelle candidature pour le poste de modérateur est envoyée sur le forum.>",
  Builder:
    "Ce système vous permet d'être alerté lorsqu'une nouvelle candidature pour le poste de buildeur est envoyée sur le forum.",
  "Pays Pillable ( 14h )":
    "Ce système permet de recevoir un message à 14h00 contenant les potentiels pays disponibles au pillage.",
  "Pays Disband ( 18h15 )":
    "Ce système permet de recevoir un message à 18h15 contenant la liste des pays disbands entre 18h00 et 18h15.",
  doublelead:
    'Ce système permet d\'être alerté lorsque de nouvelles personnes sont détectées en tant que "Double Lead" sur votre serveur.',
  "Full Build":
    "Ce système vous permet d'annoncer qu'un pays est \"Full Build\" et qu'il peut partir en expention territoriale sur un autre pays.",
  "Conquête Territoriale":
    "Ce système vous permet d'annoncer qu'un pays a valité son expention territoriale sur un autre pays.",
  Plainte:
    "Ce système permet d'être alerté lorsqu'une nouvelle plainte est postée sur le forum avec le tag \"En Attente\".",
  Guerre:
    "Ce système permet d'être alerté lorsqu'une nouvelle guerre est postée sur le forum avec le tag \"En Attente\".",
  "Plainte non traitée":
    "Ce système permet d'être alerté lorsqu'une plainte avec le tag \"En Attente\" n'a pas été modifiée depuis un nombre de jour configurable.",
  "Guerre non traitée":
    "Ce système permet d'être alerté lorsqu'une guerre avec le tag \"En Attente\" n'a pas été modifiée depuis un nombre de jour configurable.",
  Jail: "Ce système permet d'être alerté lorsqu'une personne devant aller en prison se connecte.",
  Classement:
    "Ce système permet de recevoir un message contenant le top 3 inter-serveur ainsi que le top 10 de votre serveur des notations le lundi matin à 10h00.",
  Répartition:
    "Ce système permet de répartir les notations entre les différents opérateurs de ton serveur et de recevoir un message le vendredi soir indiquant au joueur qui note son pays.",
  Alerte:
    "Ce système permet d'être alerté lorsque l'ONU de votre serveur commence.",
  "Rappel 1":
    "Ce système permet de recevoir un rappel lorsque votre ONU debutera bientôt.",
  "Rappel 2":
    "Ce système permet de recevoir un rappel lorsque votre ONU debutera bientôt.",
  "Rappel 3":
    "Ce système permet de recevoir un rappel lorsque votre ONU debutera bientôt.",
  "Récapitulatif Hebdomadaire":
    "Ce système permet de recevoir un récapitulatif de votre serveur chaque semaine à 10h15",
  "Récapitulatif Mensuel":
    "Ce système permet de recevoir un récapitulatif de votre serveur chaque mois à 10h30",
  Routine:
    "Ce système permet d'organiser vos routines avec les différentes infractions possibles.",
  "Affichage Staff":
    "Ce système permet de recevoir et de modifier automatiquement un message contenant l'effectif de votre serveur.",
  "Sanction Staff":
    "Ce système permet d'être alerté lorsque l'un de vos staffs recoient une sanction sur un serveur de NationsGlory.",
  "Joueur(s) Connecté(s)":
    "Ce système permet de mettre à jour un salon avec le nombre de joueurs connectés de votre serveur.",
};

const AUTRE_EMOJI = {
  "Attente Staff": "<:attentestaff:1458459659043078154>",
  Guide: "<:guide:1441505228007411783>",
  Modérateur: "<:moderateur:1441505230394228897>",
  Builder: "<:builder:1458468397963808872>",
  "Pays Pillable ( 14h )": "<:payspillable:1458742654010392658>",
  "Pays Disband ( 18h15 )": "<:paysdisband:1458742655692308623>",
  doublelead: "<:doublelead:1458459662851637554>",
  "Full Build": "<:fullbuild:1458742657617498183>",
  "Conquête Territoriale": "<:conqueteterritoriale:1458742659995668723>",
  Plainte: "<:plainte:1458742662160191498>",
  Guerre: "<:guerre:1458742664265732272>",
  "Plainte non traitée": "<:plaintenontraitee:1458742665842655354>",
  "Guerre non traitée": "<:guerrenontraitee:1458742667533095136>",
  Jail: "<:jail:1441734907260043264>",
  Classement: "<:classement:1458742669697351748>",
  Répartition: "<:repartition:1458742671962149018>",
  Alerte: "<:alerte:1458742674243981456>",
  "Rappel 1": "<:rappel:1458742676504580239>",
  "Rappel 2": "<:rappel:1458742676504580239>",
  "Rappel 3": "<:rappel:1458742676504580239>",
  "Récapitulatif Hebdomadaire":
    "<:recapitulatifhebdomadaire:1458742678584823902>",
  "Récapitulatif Mensuel": "<:recapitulatifmensuel:1458742680921047118>",
  Routine: "<:routine:1441734905980649695>",
  "Affichage Staff": "<:affichagestaff:1458742682787647561>",
  "Sanction Staff": "<:sanctionstaff:1458742684482273322>",
  "Joueur(s) Connecté(s)": "<:joueursconnectes:1458459673974800589>",
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
    const resultat = [];

    const fichiersConfig = getFiles(`data/${serveur}`).filter(
      (f) => f.startsWith("config-") && f.endsWith(".json"),
    );

    for (const fichier of fichiersConfig) {
      const nomSysteme = fichier.replace("config-", "").replace(".json", "");
      if (
        nomSysteme === "radio" ||
        nomSysteme === "role" ||
        nomSysteme === "changelogs"
      )
        continue;

      const contenuBrut = getData(`data/${serveur}/${fichier}`);
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
        if (systeme === "attentestaff") vraiSysteme = "Attente Staff";
        if (systeme === "jail") vraiSysteme = "Jail";
        if (systeme === "Routine") vraiSysteme = "Routine";
        if (systeme === "joueurconnecte") vraiSysteme = "Joueur(s) Connecté(s)";

        contenuFinal[vraiSysteme] = {
          emoji: AUTRE_EMOJI[vraiSysteme] || false,
          details: INFO_SUPP[vraiSysteme] || false,
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
    }

    saveData(`data/${serveur}/config.json`, resultat);

    console.log(`[${serveur}] config.json généré`);
  }
}

module.exports = genererConfigsServeurs;
