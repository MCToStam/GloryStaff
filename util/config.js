const CONFIG_STATIC = [
  {
    nom: "Attente Staff",
    emoji: "<:attentestaff:1458459659043078154>",
    permission: "guide",
    systeme: {
      "Attente Staff": {
        emoji: "<:attentestaff:1458459659043078154>",
        details: false,
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Role: {
          type: "role",
        },
      },
    },
  },
  {
    nom: "Candidature",
    emoji: "<:candidature:1458459660343447735>",
    permission: "guide",
    systeme: {
      Guide: {
        emoji: "<:guide:1441505228007411783>",
        details:
          "Ce système vous permet d'être alerté lorsqu'une nouvelle candidature pour le poste de guide est envoyée sur le forum.",
        lien: {
          alpha:
            "https://nationsglory.fr/forums/category/recrutement-guide.284",
          black:
            "https://nationsglory.fr/forums/category/recrutement-guide.202",
          blue: "https://nationsglory.fr/forums/category/recrutement-guide.53",
          coral:
            "https://nationsglory.fr/forums/category/recrutement-guide.427",
          cyan: "https://nationsglory.fr/forums/category/recrutement-guide.245",
          delta:
            "https://nationsglory.fr/forums/category/recrutement-guide.707",
          epsilon:
            "https://nationsglory.fr/forums/category/recrutement-guide.952",
          jade: "https://nationsglory.fr/forums/category/recrutement-guide.1050",
          lime: "https://nationsglory.fr/forums/category/recrutement-guide.409",
          mocha:
            "https://nationsglory.fr/forums/category/recrutement-guide.934",
          omega:
            "https://nationsglory.fr/forums/category/recrutement-guide.363",
          orange:
            "https://nationsglory.fr/forums/category/recrutement-guide.90",
          red: "https://nationsglory.fr/forums/category/recrutement-guide.650",
          sigma:
            "https://nationsglory.fr/forums/category/recrutement-guide.313",
          white:
            "https://nationsglory.fr/forums/category/recrutement-guide.175",
          yellow: "https://nationsglory.fr/forums/category/recrutement-fg.128",
        },
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12, 15],
        },
        Role: {
          type: "role",
        },
      },
      Modérateur: {
        emoji: "<:moderateur:1441505230394228897>",
        details:
          "Ce système vous permet d'être alerté lorsqu'une nouvelle candidature pour le poste de modérateur est envoyée sur le forum.",
        lien: {
          alpha:
            "https://nationsglory.fr/forums/category/recrutement-moderateur.282",
          black:
            "https://nationsglory.fr/forums/category/recrutement-moderateur.201",
          blue: "https://nationsglory.fr/forums/category/recrutement-moderateur.51",
          coral:
            "https://nationsglory.fr/forums/category/recrutement-moderateur.426",
          cyan: "https://nationsglory.fr/forums/category/recrutement-moderateur.244",
          delta:
            "https://nationsglory.fr/forums/category/recrutement-moderateur.706",
          epsilon:
            "https://nationsglory.fr/forums/category/recrutement-mod.951",
          jade: "https://nationsglory.fr/forums/category/recrutement-moderateur.1051",
          lime: "https://nationsglory.fr/forums/category/recrutement-moderateur.408",
          mocha:
            "https://nationsglory.fr/forums/category/recrutement-moderateur.933",
          omega:
            "https://nationsglory.fr/forums/category/recrutement-moderateur.362",
          orange:
            "https://nationsglory.fr/forums/category/recrutement-moderateur.89",
          red: "https://nationsglory.fr/forums/category/recrutement-moderateur.649",
          sigma:
            "https://nationsglory.fr/forums/category/recrutement-moderateur.312",
          white:
            "https://nationsglory.fr/forums/category/recrutement-moderateur.174",
          yellow:
            "https://nationsglory.fr/forums/category/recrutement-moderateur.127",
        },
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12, 15],
        },
        Role: {
          type: "role",
        },
      },
      Builder: {
        emoji: "<:builder:1458468397963808872>",
        details:
          "Ce système vous permet d'être alerté lorsqu'une nouvelle candidature pour le poste de buildeur est envoyée sur le forum.",
        lien: {
          alpha:
            "https://nationsglory.fr/forums/category/recrutement-builder.288",
          black:
            "https://nationsglory.fr/forums/category/recrutement-builder.203",
          blue: "https://nationsglory.fr/forums/category/recrutement-builder.52",
          coral:
            "https://nationsglory.fr/forums/category/recrutement-builder.428",
          cyan: "https://nationsglory.fr/forums/category/recrutement-builder.246",
          delta:
            "https://nationsglory.fr/forums/category/recrutement-builder.708",
          epsilon:
            "https://nationsglory.fr/forums/category/recrutement-builder.953",
          jade: "https://nationsglory.fr/forums/category/recrutement-builder.1053",
          lime: "https://nationsglory.fr/forums/category/recrutement-builder.410",
          mocha:
            "https://nationsglory.fr/forums/category/recrutement-builder.936",
          omega:
            "https://nationsglory.fr/forums/category/recrutement-builder.364",
          orange:
            "https://nationsglory.fr/forums/category/recrutement-builder.91",
          red: "https://nationsglory.fr/forums/category/recrutement-builder.651",
          sigma:
            "https://nationsglory.fr/forums/category/recrutement-builder.314",
          white:
            "https://nationsglory.fr/forums/category/recrutement-builder.779",
          yellow:
            "https://nationsglory.fr/forums/category/recrutement-builder.129",
        },
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12, 15],
        },
        Role: {
          type: "role",
        },
      },
    },
  },
  {
    nom: "Disband",
    emoji: "<:disband:1458459661782220892>",
    permission: "guide",
    systeme: {
      "Pays Pillable ( 14h )": {
        emoji: "<:payspillable:1458742654010392658>",
        details:
          "Ce système permet de recevoir un message à 14h00 contenant les potentiels pays disponibles au pillage.",
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Role: {
          type: "role",
        },
        Prévisualisation: {
          type: "select",
          valeurPropose: {
            Oui: "Oui",
            Non: "Non",
          },
        },
      },
      "Pays Disband ( 18h15 )": {
        emoji: "<:paysdisband:1458742655692308623>",
        details:
          "Ce système permet de recevoir un message à 18h15 contenant la liste des pays disbands entre 18h00 et 18h15.",
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Role: {
          type: "role",
        },
      },
    },
  },
  {
    nom: "Expansion Territoriale",
    emoji: "<:expantionterritoriale:1458459664768303268>",
    permission: "super_moderateur",
    systeme: {
      "Full Build": {
        emoji: "<:fullbuild:1458742657617498183>",
        details:
          "Ce système vous permet d'annoncer qu'un pays est \"Full Build\" et qu'il peut partir en expention territoriale sur un autre pays.",
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Role: {
          type: "role",
        },
      },
      "Conquête Territoriale": {
        emoji: "<:conqueteterritoriale:1458742659995668723>",
        details:
          "Ce système vous permet d'annoncer qu'un pays a valité son expention territoriale sur un autre pays.",
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Role: {
          type: "role",
        },
      },
    },
  },
  {
    nom: "Forum",
    emoji: "<:forum:1458459666282582170>",
    permission: "moderateur_test",
    systeme: {
      Plainte: {
        emoji: "<:plainte:1458742662160191498>",
        details:
          "Ce système permet d'être alerté lorsqu'une nouvelle plainte est postée sur le forum avec le tag \"En Attente\".",
        lien: {
          alpha: "https://nationsglory.fr/forums/category/plaintes.277",
          black: "https://nationsglory.fr/forums/category/plaintes.190",
          blue: "https://nationsglory.fr/forums/category/plaintes.984",
          coral: "https://nationsglory.fr/forums/category/plaintes.421",
          cyan: "https://nationsglory.fr/forums/category/plaintes.228",
          delta: "https://nationsglory.fr/forums/category/plaintes.712",
          epsilon: "https://nationsglory.fr/forums/category/plaintes.940",
          jade: "https://nationsglory.fr/forums/category/plaintes.1045",
          lime: "https://nationsglory.fr/forums/category/plaintes.388",
          mocha: "https://nationsglory.fr/forums/category/plaintes.930",
          omega: "https://nationsglory.fr/forums/category/plaintes.358",
          orange: "https://nationsglory.fr/forums/category/plaintes.78",
          red: "https://nationsglory.fr/forums/category/plaintes.659",
          sigma: "https://nationsglory.fr/forums/category/plaintes.305",
          white: "https://nationsglory.fr/forums/category/plaintes.985",
          yellow: "https://nationsglory.fr/forums/category/plaintes.112",
        },
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Role: {
          type: "role",
        },
      },
      Guerre: {
        emoji: "<:guerre:1458742664265732272>",
        details:
          "Ce système permet d'être alerté lorsqu'une nouvelle guerre est postée sur le forum avec le tag \"En Attente\".",
        lien: {
          alpha:
            "https://nationsglory.fr/forums/category/declarations-de-guerre.682",
          black:
            "https://nationsglory.fr/forums/category/declarations-de-guerres.208",
          blue: "https://nationsglory.fr/forums/category/declarations-de-guerre.61",
          coral:
            "https://nationsglory.fr/forums/category/declarations-de-guerres.435",
          cyan: "https://nationsglory.fr/forums/category/declarations-de-guerres.252",
          delta:
            "https://nationsglory.fr/forums/category/declarations-de-guerre.724",
          epsilon:
            "https://nationsglory.fr/forums/category/declaration-de-guerre.958",
          jade: "https://nationsglory.fr/forums/category/declaration-de-guerre.1055",
          lime: "https://nationsglory.fr/forums/category/declarations-de-guerres.397",
          mocha:
            "https://nationsglory.fr/forums/category/declaration-de-guerre.966",
          omega:
            "https://nationsglory.fr/forums/category/declarations-de-guerre.685",
          orange:
            "https://nationsglory.fr/forums/category/declarations-de-guerres.98",
          red: "https://nationsglory.fr/forums/category/declarations-de-guerres.667",
          sigma:
            "https://nationsglory.fr/forums/category/declarations-de-guerre.683",
          white:
            "https://nationsglory.fr/forums/category/declarations-de-guerres.177",
          yellow:
            "https://nationsglory.fr/forums/category/declarations-de-guerres.133",
        },
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Role: {
          type: "role",
        },
      },
      "Plainte non traitée": {
        emoji: "<:plaintenontraitee:1458742665842655354>",
        details:
          "Ce système permet d'être alerté lorsqu'une plainte avec le tag \"En Attente\" n'a pas été modifiée depuis un nombre de jour configurable.",
        lien: {
          alpha: "https://nationsglory.fr/forums/category/plaintes.277",
          black: "https://nationsglory.fr/forums/category/plaintes.190",
          blue: "https://nationsglory.fr/forums/category/plaintes.984",
          coral: "https://nationsglory.fr/forums/category/plaintes.421",
          cyan: "https://nationsglory.fr/forums/category/plaintes.228",
          delta: "https://nationsglory.fr/forums/category/plaintes.712",
          epsilon: "https://nationsglory.fr/forums/category/plaintes.940",
          jade: "https://nationsglory.fr/forums/category/plaintes.1045",
          lime: "https://nationsglory.fr/forums/category/plaintes.388",
          mocha: "https://nationsglory.fr/forums/category/plaintes.930",
          omega: "https://nationsglory.fr/forums/category/plaintes.358",
          orange: "https://nationsglory.fr/forums/category/plaintes.78",
          red: "https://nationsglory.fr/forums/category/plaintes.659",
          sigma: "https://nationsglory.fr/forums/category/plaintes.305",
          white: "https://nationsglory.fr/forums/category/plaintes.985",
          yellow: "https://nationsglory.fr/forums/category/plaintes.112",
        },
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Role: {
          type: "role",
        },
        Temps: {
          type: "select",
          valeurPropose: {
            "1 jour": "1",
            "2 jour": "2",
            "3 jour": "3",
            "4 jour": "4",
            "5 jour": "5",
          },
        },
      },
      "Guerre non traitée": {
        emoji: "<:guerrenontraitee:1458742667533095136>",
        details:
          "Ce système permet d'être alerté lorsqu'une guerre avec le tag \"En Attente\" n'a pas été modifiée depuis un nombre de jour configurable.",
        lien: {
          alpha:
            "https://nationsglory.fr/forums/category/declarations-de-guerre.682",
          black:
            "https://nationsglory.fr/forums/category/declarations-de-guerres.208",
          blue: "https://nationsglory.fr/forums/category/declarations-de-guerre.61",
          coral:
            "https://nationsglory.fr/forums/category/declarations-de-guerres.435",
          cyan: "https://nationsglory.fr/forums/category/declarations-de-guerres.252",
          delta:
            "https://nationsglory.fr/forums/category/declarations-de-guerre.724",
          epsilon:
            "https://nationsglory.fr/forums/category/declaration-de-guerre.958",
          jade: "https://nationsglory.fr/forums/category/declaration-de-guerre.1055",
          lime: "https://nationsglory.fr/forums/category/declarations-de-guerres.397",
          mocha:
            "https://nationsglory.fr/forums/category/declaration-de-guerre.966",
          omega:
            "https://nationsglory.fr/forums/category/declarations-de-guerre.685",
          orange:
            "https://nationsglory.fr/forums/category/declarations-de-guerres.98",
          red: "https://nationsglory.fr/forums/category/declarations-de-guerres.667",
          sigma:
            "https://nationsglory.fr/forums/category/declarations-de-guerre.683",
          white:
            "https://nationsglory.fr/forums/category/declarations-de-guerres.177",
          yellow:
            "https://nationsglory.fr/forums/category/declarations-de-guerres.133",
        },
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Role: {
          type: "role",
        },
        Temps: {
          type: "select",
          valeurPropose: {
            "1 jour": "1",
            "2 jour": "2",
            "3 jour": "3",
            "4 jour": "4",
            "5 jour": "5",
          },
        },
      },
    },
  },
  {
    nom: "Jail",
    emoji: "<:jail:1441734907260043264>",
    permission: "moderateur_test",
    systeme: {
      Jail: {
        emoji: "<:jail:1441734907260043264>",
        details: false,
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Grade: {
          type: "grade",
        },
        Role: {
          type: "role",
        },
      },
    },
  },
  {
    nom: "Joueur(s) Connecté(s)",
    emoji: "<:joueursconnectes:1458459673974800589>",
    permission: "guide",
    systeme: {
      "Joueur(s) Connecté(s)": {
        emoji: "<:joueursconnectes:1458459673974800589>",
        details: false,
        Salon: {
          type: "channel",
          salonAutorise: [0, 2, 5, 13, 15, 16],
        },
        "Texte Affiché": {
          type: "modal",
          label: "Modifier",
          questions: [
            {
              texte: "Quel texte sera affiché ?",
              description:
                "{nombre} sera remplacé par le nombre de joueurs connectés",
              placeholder: "👥 {nombre}/300 joueurs connectés",
              style: "Short",
              maxCara: 100,
              obligatoire: true,
            },
          ],
        },
      },
    },
  },
  {
    nom: "Notations",
    emoji: "<:notations:1458460474017321204>",
    permission: "guide",
    systeme: {
      Classement: {
        emoji: "<:classement:1458742669697351748>",
        details: false,
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Role: {
          type: "role",
        },
      },
      Répartition: {
        emoji: "<:repartition:1458742671962149018>",
        details: false,
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Role: {
          type: "role",
        },
        "Décalage des Notations": {
          type: "select",
          valeurPropose: {
            "Chaque semaine": "semaine",
            "Chaque mois": "mois",
            Jamais: "jamais",
          },
        },
        "Répartir Automatiquement": {
          type: "button",
          customId: "notation_module-automatique",
          style: "Primary",
        },
        "Répartir Manuellement": {
          type: "button",
          customId: "notation_module-manual",
          style: "Primary",
        },
      },
    },
  },
  {
    nom: "ONU",
    emoji: "<:onu:1458459668165824543>",
    permission: "guide",
    systeme: {
      Alerte: {
        emoji: "<:alerte:1458742674243981456>",
        details:
          "Ce système permet d'être alerté lorsque l'ONU de votre serveur commence.",
        Heure: {
          alpha: "Dimanche 17h00",
          black: "Dimanche 16h00",
          blue: "Samedi 17h00",
          coral: "Samedi 16h00",
          cyan: "Dimanche 17h30",
          delta: "Samedi 17h30",
          epsilon: "Dimanche 15h30",
          jade: "Samedi 15h00",
          lime: "Samedi 17h30",
          mocha: "Samedi 15h30",
          omega: "Samedi 18h00",
          orange: "Samedi 16h30",
          red: "Samedi 18h00",
          sigma: "Samedi 17h00",
          white: "Dimanche 17h00",
          yellow: "Dimanche 16h30",
        },
        "Salon NationsGlory": {
          alpha: "825283850342105118",
          black: "1142882601388998656",
          blue: "1142876034967027762",
          coral: "1142882303090114590",
          cyan: "1142882421277204651",
          delta: "990080466981912676",
          epsilon: "1297686644144738344",
          jade: "1165297482725597305",
          lime: "1143617770538401902",
          mocha: "1297495880479408158",
          omega: "990080466981912676",
          orange: "1142876353801228348",
          red: "1144980485685133342",
          sigma: "825285271406379029",
          white: "1142882475849306243",
          yellow: "1234150236293828678",
        },
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Role: {
          type: "role",
        },
      },
      "Rappel 1": {
        emoji: "<:rappel:1458742676504580239>",
        details:
          "Ce système permet de recevoir un rappel lorsque votre ONU debutera bientôt.",
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Role: {
          type: "role",
        },
        Temps: {
          type: "select",
          valeurPropose: {
            "5 minutes": "5",
            "10 minutes": "10",
            "15 minutes": "15",
            "20 minutes": "20",
            "30 minutes": "30",
            "40 minutes": "40",
            "50 minutes": "50",
            "1 heure": "60",
            "2 heure": "120",
            "3 heure": "180",
            "4 heure": "240",
            "5 heure": "300",
          },
        },
      },
      "Rappel 2": {
        emoji: "<:rappel:1458742676504580239>",
        details:
          "Ce système permet de recevoir un rappel lorsque votre ONU debutera bientôt.",
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Role: {
          type: "role",
        },
        Temps: {
          type: "select",
          valeurPropose: {
            "5 minutes": "5",
            "10 minutes": "10",
            "15 minutes": "15",
            "20 minutes": "20",
            "30 minutes": "30",
            "40 minutes": "40",
            "50 minutes": "50",
            "1 heure": "60",
            "2 heure": "120",
            "3 heure": "180",
            "4 heure": "240",
            "5 heure": "300",
          },
        },
      },
      "Rappel 3": {
        emoji: "<:rappel:1458742676504580239>",
        details:
          "Ce système permet de recevoir un rappel lorsque votre ONU debutera bientôt.",
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Role: {
          type: "role",
        },
        Temps: {
          type: "select",
          valeurPropose: {
            "5 minutes": "5",
            "10 minutes": "10",
            "15 minutes": "15",
            "20 minutes": "20",
            "30 minutes": "30",
            "40 minutes": "40",
            "50 minutes": "50",
            "1 heure": "60",
            "2 heure": "120",
            "3 heure": "180",
            "4 heure": "240",
            "5 heure": "300",
          },
        },
      },
    },
  },
  {
    nom: "Récapitulatif",
    emoji: "<:recapitulatif:1458459670346858683>",
    permission: "guide",
    systeme: {
      "Récapitulatif Hebdomadaire": {
        emoji: "<:recapitulatifhebdomadaire:1458742678584823902>",
        details:
          "Ce système permet de recevoir un récapitulatif de votre serveur chaque semaine à 10h15",
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Role: {
          type: "role",
        },
      },
      "Récapitulatif Mensuel": {
        emoji: "<:recapitulatifmensuel:1458742680921047118>",
        details:
          "Ce système permet de recevoir un récapitulatif de votre serveur chaque mois à 10h30",
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Role: {
          type: "role",
        },
      },
    },
  },
  {
    nom: "Routine",
    emoji: "<:routine:1441734905980649695>",
    permission: "moderateur_plus",
    systeme: {
      Routine: {
        emoji: "<:routine:1441734905980649695>",
        details:
          "Ce système permet d'organiser vos routines avec les différentes infractions possibles.",
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Grade: {
          type: "grade",
        },
        Role: {
          type: "role",
        },
      },
    },
  },
  {
    nom: "Staff",
    emoji: "<:gestionstaff:1458459672058265610>",
    permission: "super_moderateur",
    systeme: {
      "Affichage Staff": {
        emoji: "<:affichagestaff:1458742682787647561>",
        details:
          "Ce système permet de recevoir et de modifier automatiquement un message contenant l'effectif de votre serveur.",
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        "Envoyer l'Effectif": {
          type: "button",
          customId: "affichage_staff-envoyer",
          style: "Primary",
          disabled: true,
        },
      },
      "Sanction Staff": {
        emoji: "<:sanctionstaff:1458742684482273322>",
        details:
          "Ce système permet d'être alerté lorsque l'un de vos staffs recoient une sanction sur un serveur de NationsGlory.",
        Salon: {
          type: "channel",
          salonAutorise: [0, 5, 10, 11, 12],
        },
        Role: {
          type: "role",
        },
      },
    },
  },
];

module.exports = CONFIG_STATIC;
