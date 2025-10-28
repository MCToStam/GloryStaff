const {
  SlashCommandBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const { getData } = require("../../../util/module/getAndSaveData");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("staff")
    .setDescription("Affiche la liste des staffs")
    .addStringOption((option) =>
      option
        .setName("serveur")
        .setDescription("Le serveur pour lequel afficher la liste des staffs")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("staff")
        .setDescription("Le membre du staff à configurer")
        .setRequired(false)
        .setAutocomplete(true),
    ),

  async execute(client, interaction, config) {
    const serveur = interaction.options.getString("serveur").toLowerCase();

    if (serveur === "non-lie") {
      const erreurEmbed = new EmbedBuilder()
        .setTitle("Erreur")
        .setColor(config.errorcolor)
        .setDescription(
          'Votre compte Discord n\'est pas reconnu, il vous faut être renseigné pour utiliser cette commande. Pour ce faire, il te suffit de te connecter à notre panel de contrôle. Une fois connecté avec ton compte Discord, va dans la partie "Profil" puis tu as un bouton afin de lier ton compte NationsGlory.',
        )
        .setFooter({ text: config.footer });

      const panelButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("💻 Accéder au panel")
          .setStyle(ButtonStyle.Link)
          .setURL("https://glorybot.fr"),
      );

      return interaction.reply({
        embeds: [erreurEmbed],
        components: [panelButton],
        ephemeral: true,
      });
    }

    if (serveur !== "all" && !config.liste_serveur.includes(serveur)) {
      const unknownServerEmbed = {
        title: "Erreur",
        description: `Le serveur **${serveur}** n'est pas un serveur reconnu. Veuillez fournir un serveur valide.`,
        color: config.errorcolor,
        footer: { text: config.footer },
      };
      return interaction.reply({
        embeds: [unknownServerEmbed],
        ephemeral: true,
      });
    }

    const capitalizedServeur =
      serveur.charAt(0).toUpperCase() + serveur.slice(1);
    const emojiId = config.emoji[serveur.toLowerCase()];

    if (serveur === "permission") {
      const permissionEmbed = {
        title: "Erreur",
        description: `Tu n'as pas la permission d'effectuer cette commande pour le serveur <:NG${capitalizedServeur}:${emojiId}> **${capitalizedServeur}** !`,
        color: config.errorcolor,
        footer: { text: config.footer },
      };
      return interaction.reply({ embeds: [permissionEmbed], ephemeral: true });
    }

    const staffData = getData(`data/${serveur}/staff.json`);

    const isAdmin = staffData["Administrateur"]?.includes(interaction.user.id);
    const isSM = staffData["Super-Modérateur"]?.includes(interaction.user.id);
    if (!isAdmin && !isSM && interaction.user.id != config.developpeur) {
      const permissionEmbed = {
        title: "Erreur",
        description: `Tu n'as pas la permission d'effectuer cette commande !`,
        color: config.errorcolor,
        footer: { text: config.footer },
      };
      return interaction.reply({ embeds: [permissionEmbed], ephemeral: true });
    }

    const joueur = interaction.options.getString("staff");

    if (!joueur) {
      const responseLink = await fetch(`${config.glorybot_url}/api/get-ng`);
      const fullStaffData = getData(`data/${serveur}/staff-serveur.json`);
      const linkBrut = await responseLink.json();
      const linkData = linkBrut.data;

      const embed = new EmbedBuilder()
        .setTitle(
          `Liste des Staffs du serveur ${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }`,
        )
        .setColor(config.couleur[serveur] || 0x00ae86)
        .setFooter({ text: config.footer });

      let fullStaffSection = "";
      for (const [grade, members] of Object.entries(fullStaffData)) {
        if (members.length > 0) {
          const emoji = config.emojigrade[grade] || "";
          const memberNames = members
            .map((name) => {
              const linkedId = Object.keys(linkData).find(
                (id) => linkData[id] === name,
              );
              const escapedName = name.replace(/_/g, "\\_");
              return linkedId
                ? `${escapedName} ( <@${linkedId}> )`
                : escapedName;
            })
            .join(", ");
          fullStaffSection += `**${emoji} ${grade} :** ${memberNames}\n`;
        }
      }
      fullStaffSection =
        fullStaffSection ||
        "Aucune donnée trouvée dans le fichier staff-serveur.json.";

      embed.setDescription(fullStaffSection);

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("totalStaff")
        .setPlaceholder("Sélectionnez une option")
        .addOptions([
          {
            label: "Liaison des OPs",
            value: "totalstaff_liaisonop",
            emoji: "1333877538946285739",
          },
          {
            label: "Connexion",
            value: "totalstaff_connexion",
            emoji: "1363956750704709642",
          },
        ]);

      const actionRow = new ActionRowBuilder().addComponents(selectMenu);

      return interaction.reply({
        embeds: [embed],
        components: [actionRow],
        ephemeral: true,
      });
    } else {
      const fullStaffData = getData(`data/${serveur}/staff-serveur.json`);

      let joueurExiste = false;
      let gradeDuJoueur = null;

      for (const [grade, members] of Object.entries(fullStaffData)) {
        if (Array.isArray(members) && members.includes(joueur)) {
          joueurExiste = true;
          gradeDuJoueur = grade;
          break;
        }
      }

      if (!joueurExiste) {
        return interaction.reply({
          embeds: [
            {
              title: "Erreur",
              description: `Le joueur "**${joueur}**" n'existe pas ou ne fait pas partie du staff du serveur <:NG${serveur
                .charAt(0)
                .toUpperCase()}${serveur.slice(1)}:${
                config.emoji[serveur]
              }> **${serveur.charAt(0).toUpperCase()}${serveur.slice(1)}**.`,
              color: config.errorcolor,
              footer: { text: config.footer },
            },
          ],
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });

      let linkedDiscordId;
      try {
        const responseLinked = await fetch(
          `${config.glorybot_url}/api/get-ng?pseudo=${encodeURIComponent(
            joueur,
          )}`,
        );
        if (!responseLinked.ok)
          throw new Error(`Erreur API: ${responseLinked.status}`);
        const data = await responseLinked.json();

        linkedDiscordId = data.discordId || null;
      } catch (e) {
        linkedDiscordId = null;
      }

      const staffData = getData(`data/${serveur}/staff/${joueur}.json`);

      let blame = 0;
      let texte_blame = "Blâme";
      if (staffData["Blâme 3"]) {
        blame = 3;
        texte_blame = "Blâmes";
      } else if (staffData["Blâme 2"]) {
        blame = 2;
        texte_blame = "Blâmes";
      } else if (staffData["Blâme 1"]) {
        blame = 1;
        texte_blame = "Blâme";
      } else {
        blame = 0;
        texte_blame = "Blâme";
      }

      let sanctioninterserv = "";
      if (staffData.blue !== undefined) {
        const totalSanctions = config.liste_serveur.reduce((total, serveur) => {
          return total + (staffData[serveur] || 0);
        }, 0);

        sanctioninterserv = `\n**Sanction Inter-Serveur :** ${totalSanctions}`;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      let body = null;

      try {
        const res = await fetch(
          `https://publicapi.nationsglory.fr/user/${joueur}`,
          {
            headers: {
              Authorization: `Bearer ${config.apitoken}`,
              Accept: "application/json",
            },
            signal: controller.signal,
          },
        );

        clearTimeout(timeout);
        body = await res.json();
      } catch (error) {
        if (error.name === "AbortError") {
          console.error("Requête annulée après 2 secondes.");
        } else {
          console.error(
            "Erreur lors de la récupération des données :",
            error.message,
          );
        }
      }

      const imageUrl = `https://skins.nationsglory.fr/body/${joueur}/3d/4?vr=-20&hr=10&hrh=20&vrla=50&vrra=-10&vrll=-10&vrrl=20&ratio=12&format=png&displayHair=true&headOnly=false&layers=false`;
      const response = await fetch(imageUrl);

      const buffer = Buffer.from(await response.arrayBuffer());

      const image = await loadImage(buffer);

      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d");

      ctx.scale(-1, 1);
      ctx.drawImage(image, -image.width, 0);

      const flippedImageBuffer = canvas.toBuffer();

      const routineData = getData(`data/${serveur}/routine.json`);

      let linkedMinecraftPseudonym;
      if (config.liste_serveur_bedrock.includes(serveur)) {
        const responseLinked = await fetch(
          `${
            config.glorybot_url
          }/api/get-bedrock?pseudo_ng=${encodeURIComponent(joueur)}`,
        );
        if (!responseLinked.ok)
          throw new Error(`Erreur API: ${responseLinked.status}`);
        const data = await responseLinked.json();

        linkedMinecraftPseudonym = data.pseudo_mc || null;
      }

      const embed = new EmbedBuilder()
        .setTitle(`Gestion Staff - ${joueur.replace(/_/g, "\\_")}`)
        .setDescription(
          `**Grade :** ${
            config.emojigrade[gradeDuJoueur]
          } ${gradeDuJoueur}\n**Liaison Discord :** ${
            linkedDiscordId ? `<@${linkedDiscordId}>` : "Aucune liaison"
          }${
            config.liste_serveur_bedrock.includes(serveur)
              ? `\n**Liaison Minecraft :** ${
                  linkedMinecraftPseudonym
                    ? linkedMinecraftPseudonym
                    : "Aucune liaison"
                }`
              : ""
          }\n**${texte_blame} :** ${blame}${sanctioninterserv}${
            body && body.servers && body.servers[serveur]
              ? `\n\n**Dernière Connexion ${serveur
                  .charAt(0)
                  .toUpperCase()}${serveur.slice(1)} :** <t:${Math.floor(
                  new Date(
                    new Date(
                      body.servers[serveur].last_connection + " GMT+0200",
                    ).toISOString(),
                  ).getTime() / 1000,
                )}:R>\n**Temps de Jeu ${serveur
                  .charAt(0)
                  .toUpperCase()}${serveur.slice(1)} :** ${convertirTemps(
                  body.servers[serveur].playtime,
                )}\n**Temps de Jeu Total :** ${totalTemps(body)}`
              : ""
          }`,
        )
        .setColor(config.couleur[serveur])
        .setFooter({ text: config.footer })
        .setThumbnail("attachment://modele.png");

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("gestionStaff")
        .setPlaceholder("Sélectionnez une option")
        .addOptions([
          {
            label: "Liaison Discord",
            value: "gestionstaff_liaisondiscord",
            emoji: "1333877538946285739",
          },
          {
            label: "Blâme",
            value: "gestionstaff_blame",
            emoji: "1333876277651705878",
          },
          {
            label: "Date de Rank",
            value: "gestionstaff_datederank",
            emoji: "1333876299336515645",
          },
          {
            label: "Punisher",
            value: "gestionstaff_punisher",
            emoji: "1410535886789017600",
          },
        ]);

      if (routineData[joueur]) {
        selectMenu.addOptions([
          {
            label: "Routine",
            value: "gestionstaff_routine",
            emoji: "1342098615090413568",
          },
        ]);
      }

      if (config.liste_serveur_bedrock.includes(serveur)) {
        selectMenu.addOptions([
          {
            label: "Liaison Minecraft",
            value: "gestionstaff_liaisonminecraft",
            emoji: "1132392965277495416",
          },
        ]);
      }

      if (
        !config.liste_serveur_bedrock.includes(serveur) ||
        linkedMinecraftPseudonym
      ) {
        selectMenu.addOptions([
          {
            label: "Connexion",
            value: "gestionstaff_connexion",
            emoji: "1363956750704709642",
          },
        ]);
      }

      const actionRow = new ActionRowBuilder().addComponents(selectMenu);

      return interaction.editReply({
        embeds: [embed],
        components: [actionRow],
        files: [{ attachment: flippedImageBuffer, name: "modele.png" }],
        ephemeral: true,
      });
    }
  },
};

function convertirTemps(secondes) {
  const jours = Math.floor(secondes / (3600 * 24));
  const heures = Math.floor((secondes % (3600 * 24)) / 3600);
  const minutes = Math.floor((secondes % 3600) / 60);

  let temps = "";

  if (jours > 0) {
    temps += jours + " jour" + (jours > 1 ? "s" : "") + ", ";
  }

  if (heures > 0) {
    temps += heures + " heure" + (heures > 1 ? "s" : "") + " et ";
  }

  temps += minutes + " minute" + (minutes > 1 ? "s" : "");

  return temps;
}

function totalTemps(body) {
  let total = 0;
  for (let server in body.servers) {
    if (body.servers[server].playtime) {
      total = total + body.servers[server].playtime;
    }
  }

  return convertirTemps(total);
}
