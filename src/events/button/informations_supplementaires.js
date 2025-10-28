const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  data: {
    name: "informations_supplementaires",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const systemebrut = interaction.customId.split("-")[1]

    let systeme;
    if (systemebrut === "attentestaff") {
      systeme = "Attente Staff";
    } else if (systemebrut === "doublelead") {
      systeme = "Double Lead";
    } else {
      systeme = systemebrut;
    }

    const color = interaction.message.components[0].data.accent_color;

    const serveur = Object.keys(config.couleur).find((key) => {
      const hexValue = config.couleur[key];
      const decimalValue =
        typeof hexValue === "string" ? parseInt(hexValue, 16) : hexValue;
      return decimalValue === color;
    });

    let description = "";
    if (systeme === "role") {
      description = `Le système de rôle vous permet de donner automatiquement le rôle configuré une fois la commande "/rank" exécutée. Vous pouvez choisir de ne pas remplir un champ du formulaire si vous ne souhaitez pas donner la permission au robot de donner un de ces grades. Le rôle est donné uniquement si le système est activé et que le rôle est défini. Enfin, l'intégralité des autres rôles staff seront retirés de la personne. Pour se faire, vous avez 5 paramétrages :\n- Guide : ID du rôle de guide\n- Modérateur Test : ID du rôle de modérateur test\n- Modérateur : ID du rôle de modérateur\n- Modérateur Plus : ID du rôle de modérateur plus\n- Super-Modérateur : ID du rôle de super-modérateur`;
    } else if (systeme === "Alerte") {
      description = `Ce système vous permettra d'envoyer automatiquement, à l'heure du début de votre ONU, un message pouvant mentionner votre communauté si vous le souhaitez. De plus, il propose d'expliquer aux joueurs comment accéder à cette réunion et les différentes étapes. Pour se faire, vous avez 2 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné`;
    } else if (systeme === "Rappel 1") {
      description = `Ce système vous permettra d'envoyer automatiquement, un rappel de votre ONU. Pour ce faire, vous avez 3 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné\n- Temps : Nombre de minutes avant l'ONU ( si votre ONU débute à 17h00 et que temps est définit sur "30", alors le message sera envoyé 30 minutes avant soit 16h30 )`;
    } else if (systeme === "Rappel 2") {
      description = `Ce système vous permettra d'envoyer automatiquement, un rappel de votre ONU. Pour ce faire, vous avez 3 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné\n- Temps : Nombre de minutes avant l'ONU ( si votre ONU débute à 17h00 et que temps est définit sur "60", alors le message sera envoyé 1 heure avant soit 16h00 )`;
    } else if (systeme === "Rappel 3") {
      description = `Ce système vous permettra d'envoyer automatiquement, un rappel de votre ONU. Pour ce faire, vous avez 3 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné\n- Temps : Nombre de minutes avant l'ONU ( si votre ONU débute à 17h00 et que temps est définit sur "120", alors le message sera envoyé 2 heures avant soit 15h00 )`;
    } else if (systeme === "Affichage Staff") {
      description = `Ce système uniquement permet à votre communauté d'être tenue au courant de la liste de l'effectif de votre staff. Cette liste est mise à jour 3 fois par jour. Les actualisations sont faites durant l'après-midi et la soirée. Pour se faire, vous avez 1 paramétrages :\n- Salon : ID du salon où sera envoyé le message`;
    } else if (systeme === "Sanction Staff") {
      description = `Ce module vous permet de gagner beaucoup de temps afin d'être avertis dès lors qu'un membre du staff se prend une sanction sur n'importe quel serveur de NationsGlory. À savoir que les sanctions récoltées comptent aussi celles supprimées par les responsables staff. La recherche du nombre de sanctions se fait 2 fois par jour, une fois vers minuit et l'autre vers midi. midi. Pour se faire, vous avez 2 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné`;
    } else if (systeme === "Pays Pillable ( 14h )") {
      description = `Un message sera envoyé à 14h afin d'avertir que des pays sont disponibles au pillage. Pour ce faire, vous avez 3 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné\n- Prévisualisation : "Oui" ou "Non" afin d'afficher la liste des pays qui devraient être en pillage.`;
    } else if (systeme === "Pays Disband ( 18h15 )") {
      description = `Un message sera envoyé à 18h15 afin d'informer des pays qui ont disband ainsi que ceux qui ont été recréés lors des disbands. Pour ce faire, vous avez 2 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné`;
    } else if (systeme === "Récapitulatif Hebdomadaire") {
      description = `Un récapitulatif du serveur sera envoyé tous les lundis à 12h comprenant l'argent total distribué aux notations, un graphique de connexion sur toute la semaine, la moyenne de joueurs connectés, le maximum, les 5 staffs avec le plus de temps de jeu. Il y aura aussi le classement de votre serveur parmi tous les autres. Pour se faire, vous avez 2 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné`;
    } else if (systeme === "Récapitulatif Mensuel") {
      description = `Un récapitulatif du serveur sera envoyé tous les premiers du mois à 12h comprenant l'argent total distribué au notations, un graphique de connexion sur tout le mois, la moyenne de joueurs connectés, le maximum, les 5 staffs avec le plus de temps de jeu. Il y aura aussi le classement de votre serveur parmi tous les autres. Pour se faire, vous avez 2 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné`;
    } else if (systeme === "radio") {
      description = `Ce système vous permet d'avoir un salon vocal ou de conférence avec lequel le robot vous fera écouter la NGRadio en boucle et sans aucune coupure. Pour se faire, vous avez 1 paramétrages :\n- Salon : ID du salon où le robot se connectera`;
    } else if (systeme === "routine") {
      description = `Le grade configuré pourra dès maintenant effectuer des routines en informant des infractions dans cette liste :\n- Bunker Illégal\n- Anti-AFK\n- Auto-Clic\n- Stack Item\n- AutoNuke Illégal\n- XRay\n- Autre\nLes dates du début et de la fin de la routine sont automatiquement sauvegardées. Une fois celle-ci terminée, elle est envoyée dans un salon configuré en informant le rôle configuré uniquement si au moins une infraction est constatée. Enfin, des statistiques des routines d'une personne sont enregistrées dans le module de gestion staff. Pour se faire, vous avez 3 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné uniquement s'il y a des infractions\n- Grade Autorisé (optionnel) : Nom du grade autorisé à faire des routines`;
    } else if (systeme === "Full Build") {
      description = `Annonce à tes joueurs lorsqu'un pays a validé son fullbuild avec de partir en expansion sur un autre pays. Pour se faire, vous avez 2 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné`;
    } else if (systeme === "Conquête Territoriale") {
      description = `Annonce à tes joueurs lorsqu'un pays a réussi à s'étendre entièrement sur un autre pays. Pour se faire, vous avez 2 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné`;
    } else if (systeme === "Double Lead") {
      description = `Sois averti lorsqu'un joueur a plusieurs pays sur plusieurs serveurs différents. Il est impossible pour le moment d'analyser le potentiel double lead à l'aide des doubles comptes car cela demanderait d'utiliser des permissions d'opérateurs, ce qui  n'est pas le but du projet. Pour se faire, vous avez 2 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné`;
    } else if (systeme === "Plainte") {
      description = `Tu seras averti lorsqu'une nouvelle plainte est qualifiée d'en attente sur la page forum de ton serveur. Un bouton sera disponible afin d'accéder à cette plainte. Le message est automatiquement supprimé une fois que la plainte est traitée. Pour se faire, vous avez 2 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné`;
    } else if (systeme === "Guerre") {
      description = `Tu seras averti lorsqu'une nouvelle guerre est qualifiée d'en attente sur la page forum de ton serveur. Un bouton sera disponible afin d'accéder à cette guerre. Le message est automatiquement supprimé une fois que la guerre est traitée. Pour se faire, vous avez 2 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné`;
    } else if (systeme === "Plainte non traitée") {
      description = `Tu recevras une notification lorsqu'une plainte est qualifiée d'en attente après un nombre de jours que vous pouvez configurer. Pour se faire, vous avez 3 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné\n- Temps : Nombre de jour après laquelle la plainte a été postée`;
    } else if (systeme === "Guerre non traitée") {
      description = `Tu recevras une notification lorsqu'une guerre est qualifiée d'en attente après un nombre de jours que vous pouvez configurer. Pour se faire, vous avez 3 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné\n- Temps : Nombre de jour après laquelle la guerre a été postée`;
    } else if (systeme === "répartition") {
      description = `Cela te permet de mélanger l'ordre des notations aléatoirement entre les super-modérateurs et administrateurs qui sont inscrits dans les données du robot. Si le système est activé avec un salon de défini ainsi que la liste des pays répartis, alors un message sera envoyé tous les vendredis à 20h comprenant l'ordre des notations actuel ainsi que le tableau de la liste des pays avec leur numéro. Le rôle sera mentionné s'il est renseigné. Il y a un bouton permettant d'obtenir plus d'informations à propos des notations. Pour se faire, vous avez 2 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné`;
    } else if (systeme === "classement") {
      description = `Tous les lundis à 11h sera envoyé un message comprenant les 3 meilleurs pays aux notations et ce à l'inter-serveur. De plus, les 10 premiers de votre serveur seront affichés. Il y a un bouton permettant d'obtenir plus d'informations à propos des notations ainsi qu'un bouton permettant de savoir qui a noté son pays. Pour se faire, vous avez 2 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné`;
    } else if (systeme === "alerte") {
      description = `Ce système permet d'être avertis à différentes horaires afin de vous informer lorsque des pays ne sont pas noté le dimanche soir. Une alerte classique mentionnera uniquement le staff en charge des notations alors que les alertes globales mentionneront l'intégralité des staffs. Le message est envoyé dans votre salon personnel sur le discord support de GloryStaff.\n\n**<:warn:1132393388461793382> En raison d'un problème sur l'API publique de NationsGlory, ce système est temporairement inactif en l'attente d'une correction du problème de la part de WebNations.**`;
    } else if (systeme === "jail") {
      description = `Ce système permet de mettre en forme un message de jail afin d'avertir qu'une personne doit se faire emprisonner. De plus, dès lors que cette personne se connecte, il est possible d'être avertis. Pour se faire, vous avez 3 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné lorsque le joueur à jail se connecte\n- Grade Autorisé : Nom du grade autorisé à faire des jails`;
    } else if (systeme === "Attente Staff") {
      description = `Cette configuration permet d'envoyer un message et de mentionner un ou plusieurs rôles lorsqu'une personne rejoint le canal attente staff de votre serveur. Pour se faire, vous avez 2 paramétrages :\n- Salon : ID du salon où sera envoyé le message\n- Rôle (optionnel) : ID du rôle qui sera mentionné lorsque le joueur à jail se connecte`;
    } else {
      description =
        "Aucune information supplémentaire disponible pour le moment.";
    }

    try {
      const embed = new EmbedBuilder()
        .setTitle(
          `Informations Supplémentaires - ${systeme
            .charAt(0)
            .toUpperCase()}${systeme.slice(1)}`
        )
        .setColor(config.couleur[serveur])
        .setDescription(description)
        .setFooter({ text: config.footer });

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`previsualisation-${systeme}`)
          .setLabel("Afficher une prévisualisation du module")
          .setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({
        embeds: [embed],
        components: [actionRow],
        ephemeral: true,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la gestion des informations supplémentaires :",
        error
      );
      return interaction.reply({
        content:
          "Une erreur est survenue lors de la récupération des informations supplémentaires.",
        ephemeral: true,
      });
    }
  },
};
