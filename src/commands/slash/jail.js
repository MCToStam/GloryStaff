const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const AbortController = require("abort-controller");
const { getData, saveData } = require("../../../util/module/getAndSaveData");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("jail")
    .setDescription("Effectue un jail")
    .addStringOption((option) =>
      option
        .setName("serveur")
        .setDescription("Le serveur pour lequel faire un jail")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("criminel")
        .setDescription("Joueur qui doit subir le jail")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("durée")
        .setDescription("Durée du jail (ex: 1h, 30m)")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("lien_raison")
        .setDescription("Lien ou raison du jail")
        .setRequired(true),
    ),

  async execute(client, interaction, config) {
    const serveur = interaction.options.getString("serveur").toLowerCase();

    const criminelPotentiel = interaction.options.getString("criminel");
    const duree = interaction.options.getString("durée");
    const lien_raison = interaction.options.getString("lien_raison");

    const isLienValide = lien_raison.startsWith(
      "https://nationsglory.fr/forums/thread/",
    );

    const dureeRegex = /^(\d+)([hmdb])$/;
    const match = duree.match(dureeRegex);

    if (!match) {
      const erreurEmbed = new EmbedBuilder()
        .setTitle("Durée invalide")
        .setColor(config.errorcolor)
        .setDescription(
          "La durée doit être au format suivant :\n`1h` (1 heure), `30m` (30 minutes), `2d` (2 jours), etc.\n Elle peut aussi être du format `100b` dans le cas d'un jailblock.",
        )
        .setFooter({ text: config.footer });
      return interaction.reply({ embeds: [erreurEmbed], ephemeral: true });
    }

    const quantite = parseInt(match[1]);
    const unite = match[2];

    let dureeLisible = "";

    switch (unite) {
      case "h":
        dureeLisible = quantite === 1 ? "1 heure" : `${quantite} heures`;
        break;
      case "m":
        dureeLisible = quantite === 1 ? "1 minute" : `${quantite} minutes`;
        break;
      case "d":
        dureeLisible = quantite === 1 ? "1 jour" : `${quantite} jours`;
        break;
      case "b":
        dureeLisible = quantite === 1 ? "1 bloc" : `${quantite} blocs`;
        break;
    }

    const searchRes = await fetch(
      `https://apiv2.nationsglory.fr/forums/userSearch?search=${criminelPotentiel}`,
    );
    const similarUsers = await searchRes.json();

    const foundUser = similarUsers.find(
      (user) => user.username.toLowerCase() === criminelPotentiel.toLowerCase(),
    );

    if (!foundUser) {
      let suggestions = similarUsers
        .map((user) => `- ${user.username.replace(/_/g, "\\_")}`)
        .join("\n");
      let description;

      if (similarUsers.length === 0) {
        description = "L'utilisateur que vous recherchez n'existe pas.";
      } else {
        description = `L'utilisateur que vous recherchez n'existe pas, il s'agit peut-être de\n\n${suggestions}`;
      }

      const errorembed = {
        author: { name: "Erreur" },
        footer: { text: config.footer },
        color: config.errorcolor,
        thumbnail: { url: `https://i.imgur.com/ZB0yLME.png` },
        description: description,
      };
      return interaction.reply({ embeds: [errorembed], ephemeral: true });
    }

    const criminel = foundUser.username;

    const configJail = getData(`data/${serveur}/config-jail.json`);

    if (!configJail.jail?.active) {
      const erreurEmbed = new EmbedBuilder()
        .setTitle("Erreur")
        .setColor(config.errorcolor)
        .setDescription(
          `Le système de jail n'est pas configuré sur le serveur <:NG${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }:${config.emoji[serveur.toLowerCase()]}> **${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }** !`,
        )
        .setFooter({ text: config.footer });
      return interaction.reply({ embeds: [erreurEmbed], ephemeral: true });
    }

    if (!configJail.jail?.Salon.valeur || !configJail.jail?.Grade.valeur) {
      const erreurEmbed = new EmbedBuilder()
        .setTitle("Erreur")
        .setColor(config.errorcolor)
        .setDescription(
          `Le système de jail n'est pas complètement configuré sur le serveur <:NG${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }:${config.emoji[serveur.toLowerCase()]}> **${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }** !`,
        )
        .setFooter({ text: config.footer });
      return interaction.reply({ embeds: [erreurEmbed], ephemeral: true });
    }

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

    if (!pseudo) {
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

    const staffData = getData(`data/${serveur}/staff-serveur.json`);
    const roleAutorise = configJail.jail.Grade.valeur;

    const gradesHierarchie = [
      "Administrateur",
      "Super-Modérateur",
      "Modérateur Plus",
      "Modérateur",
      "Modérateur Test",
      "Guide",
    ];

    const indexRoleAutorise = gradesHierarchie.indexOf(roleAutorise);
    const utilisateurAutorise = gradesHierarchie
      .slice(0, indexRoleAutorise + 1)
      .some((grade) => staffData[grade] && staffData[grade].includes(pseudo));

    if (!utilisateurAutorise) {
      const erreurEmbed = new EmbedBuilder()
        .setTitle("Erreur")
        .setColor(config.errorcolor)
        .setDescription(
          `Vous ne possédez pas le rôle ${
            config.emojigrade[roleAutorise]
          } **${roleAutorise}** sur le serveur <:NG${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }:${config.emoji[serveur.toLowerCase()]}> **${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }**.`,
        )
        .setFooter({ text: config.footer });
      return interaction.reply({ embeds: [erreurEmbed], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const imageUrl = `https://skins.nationsglory.fr/body/${criminel}/3d/4?vr=-20&hr=10&hrh=20&vrla=50&vrra=-10&vrll=-10&vrrl=20&ratio=12&format=png&displayHair=true&headOnly=false&layers=false`;
    let imageBuffer = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(imageUrl, { signal: controller.signal });

      clearTimeout(timeout);

      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        const image = await loadImage(buffer);

        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext("2d");

        ctx.scale(-1, 1);
        ctx.drawImage(image, -image.width, 0);

        imageBuffer = canvas.toBuffer();
      }
    } catch (err) {}

    let descriptionEmbed = `**Durée** : ${dureeLisible}\n`;
    descriptionEmbed += isLienValide
      ? `**Lien de la plainte :** [Clic Ici](${lien_raison})`
      : `**Raison :** ${lien_raison}`;

    const embed = new EmbedBuilder()
      .setTitle(`🚧 Jail sur ${criminel.replace(/_/g, "\\_")}`)
      .setColor(config.couleur[serveur])
      .setDescription(descriptionEmbed)
      .setFooter({ text: config.footer });

    if (imageBuffer) {
      embed.setThumbnail("attachment://modele.png");
    }

    const buttonFinish = new ButtonBuilder()
      .setCustomId("jail_finish")
      .setLabel("Jail Effectué")
      .setStyle(ButtonStyle.Success);
    let buttonLink;
    if (isLienValide) {
      buttonLink = new ButtonBuilder()
        .setLabel("Aller sur la plainte")
        .setStyle(ButtonStyle.Link)
        .setURL(lien_raison);
    }

    const actionRow = new ActionRowBuilder().addComponents(
      isLienValide ? [buttonFinish, buttonLink] : [buttonFinish],
    );

    const salon = await interaction.client.channels.fetch(
      configJail.jail?.Salon.valeur,
    );

    const files = imageBuffer
      ? [{ attachment: imageBuffer, name: "modele.png" }]
      : [];

    const message = await salon.send({
      embeds: [embed],
      files,
      components: [actionRow],
    });

    const thread = await message.startThread({
      name: `Connexion de ${criminel}`,
      autoArchiveDuration: 4320,
      reason: `Fil automatique pour les connexions de ${criminel}`,
    });

    const introEmbed = new EmbedBuilder()
      .setTitle(`🔎 Connexion de ${criminel}`)
      .setColor(config.couleur[serveur])
      .setDescription(
        "Vous serez avertis dès lors que le joueur se connectera dans ce fil.",
      )
      .setFooter({ text: config.footer });

    await thread.send({ embeds: [introEmbed] });

    let jailData = getData(`data/${serveur}/jail.json`);

    if (!jailData[criminel]) {
      jailData[criminel] = [];
    }

    jailData[criminel].push({
      duree: dureeLisible,
      lien: lien_raison,
      messageId: message.id,
      threadId: thread.id,
      channelId: message.channelId,
      connecte: false,
      jailed: false,
    });

    saveData(`data/${serveur}/jail.json`, jailData);

    const messageLink = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;

    const userEmbed = new EmbedBuilder()
      .setTitle("🚧 Jail")
      .setColor(config.couleur[serveur])
      .setDescription(`Le jail a correctement été envoyé ici : ${messageLink}`)
      .setFooter({ text: config.footer });

    interaction.editReply({ embeds: [userEmbed], ephemeral: true });
  },
};
