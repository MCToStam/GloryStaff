const { createCanvas, loadImage } = require("canvas");
const {
  getAbsolutePath,
  getData,
} = require("../../../util/module/getAndSaveData");
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require("discord.js");
const {
  errorStaffContainer,
  discordStaff,
} = require("../../../util/module/discordLink");

function getContrastTextColor(colorNumber) {
  const hex = colorNumber.toString(16).padStart(6, "0");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 180 ? "#55545B" : "#FBF0CA";
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let offsetY = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + (line ? " " : "") + words[n];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y + offsetY);
      line = words[n];
      offsetY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y + offsetY);
}

function drawRoundedHexagonPath(ctx, x, y, width, height, radius) {
  const points = [
    { x: x + width / 2, y: y },
    { x: x + width, y: y + height / 4 },
    { x: width + x, y: y + (height * 3) / 4 },
    { x: x + width / 2, y: y + height },
    { x: x, y: y + (height * 3) / 4 },
    { x: x, y: y + height / 4 },
  ];

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    ctx.arcTo(p1.x, p1.y, p2.x, p2.y, radius);
  }

  ctx.closePath();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Rank une personne")
    .addStringOption((option) =>
      option
        .setName("serveur")
        .setDescription("Le serveur pour lequel rank une personne")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addUserOption((option) =>
      option
        .setName("pseudo")
        .setDescription("Le pseudonyme du joueur")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("grade")
        .setDescription("Le grade de l'utilisateur")
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async execute(client, interaction, config) {
    const serveur = interaction.options.getString("serveur").toLowerCase();

    const { errorContainer } = await errorStaffContainer(serveur);

    if (errorContainer) {
      return interaction.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const {
      pseudonym: pseudo_staff,
      servers,
      container,
    } = await discordStaff(interaction.user.id, serveur, "super_moderateur");

    if (container) {
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const grade = interaction.options.getString("grade");
    const membre = interaction.options.getUser("pseudo");
    const utilisateur = interaction.guild.members.cache.get(membre.id);

    const gradeConfig = getData(`data/${serveur}/grade.json`);

    const [categorieId, gradeId] = grade.split("_");

    const gradesCategorie = gradeConfig.grade.filter(
      (g) => g.categorie === categorieId,
    );

    const gradeChoisi = gradesCategorie.find((g) => g.id === gradeId);

    if (!gradeChoisi) {
      const embed = new EmbedBuilder()
        .setColor(config.errorcolor)
        .setTitle("❌ Grade introuvable")
        .setDescription(
          `Le grade \`${grade}\` n'existe pas sur le serveur ${
            config.emoji_formate[serveur]
          } **${serveur.charAt(0).toUpperCase() + serveur.slice(1)}**.`,
        )
        .setFooter({ text: config.footer });

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    const rolesCategorie = gradesCategorie.flatMap((g) => g.role || []);

    const rolesGrade = gradeChoisi.role || [];

    let pseudonym;
    try {
      const response = await fetch(
        `${config.glorybot_url}/api/get-ng?discordId=${membre.id}`,
      );
      if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
      const data = await response.json();

      pseudonym = data.pseudo || null;
    } catch (e) {
      pseudonym = null;
    }

    let replyInteraction;
    if (pseudonym) {
      await interaction.deferReply();
      replyInteraction = interaction;
    } else {
      const modal = new ModalBuilder()
        .setCustomId("rankModal_" + membre.id)
        .setTitle("Choisissez le pseudonyme de la personne");

      const pseudonymInput = new TextInputBuilder()
        .setCustomId("pseudonymInput")
        .setLabel(`Pseudonyme de ${utilisateur.displayName}`)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(32);

      const actionRow = new ActionRowBuilder().addComponents(pseudonymInput);
      modal.addComponents(actionRow);
      await interaction.showModal(modal);

      const filter = (i) =>
        i.customId === "rankModal_" + membre.id &&
        i.user.id === interaction.user.id;

      try {
        const submitted = await interaction.awaitModalSubmit({
          filter,
          time: 120000,
        });

        pseudonym = submitted.fields.getTextInputValue("pseudonymInput").trim();

        const response = await fetch(`${config.glorybot_url}/api/ng-link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            discord_id: membre.id,
            pseudo_ng: pseudonym,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          if (
            typeof data.error === "string" &&
            data.error.startsWith(
              "L'utilisateur que vous recherchez n'existe pas",
            )
          ) {
            const errorEmbed = new EmbedBuilder()
              .setTitle(`❌ Liaison échouée - ${pseudonym}`)
              .setDescription(data.error)
              .setColor(config.errorcolor)
              .setFooter({ text: config.footer });

            return submitted.reply({
              embeds: [errorEmbed],
              ephemeral: true,
            });
          }

          return interaction.reply({
            content: `❌ Erreur lors de la liaison :\n${
              data.error || "Utilisateur introuvable."
            }`,
            ephemeral: true,
          });
        }

        await submitted.deferReply();
        replyInteraction = submitted;
      } catch (e) {
        console.log("Modal non soumis ou erreur :", e);
        return interaction.followUp({
          content:
            "Vous n'avez pas renseigné de pseudonyme ou le délai est écoulé. La commande a été annulée.",
          ephemeral: true,
        });
      }
    }

    const subtitle = gradeChoisi.subtitle_rank;
    const badgeText = serveur.charAt(0).toUpperCase() + serveur.slice(1);
    let iconPath;
    if (config.liste_serveur_bedrock.includes(serveur)) {
      iconPath = getAbsolutePath("data/icon-bedrock.png");
    } else {
      iconPath = getAbsolutePath("data/icon-java.png");
    }
    const avatarUrl = `https://skins.nationsglory.fr/body/${pseudonym}/3d/4?vr=-20&hr=10&hrh=20&vrla=50&vrra=-10&vrll=-10&vrrl=20&ratio=12&format=png&displayHair=true&headOnly=false&layers=false`;

    const W = 1920;
    const H = 1080;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#eeeff3";
    ctx.fillRect(0, 0, W, H);

    const hexWidth = 600;
    const hexHeight = 665;
    const hexX = (W * 0.45 - hexWidth) / 2;
    const hexY = (H - hexHeight) / 2;
    const hexCornerRadius = 50;

    ctx.fillStyle = gradeChoisi.couleur;
    drawRoundedHexagonPath(
      ctx,
      hexX,
      hexY,
      hexWidth,
      hexHeight,
      hexCornerRadius,
    );
    ctx.fill();

    ctx.save();
    const points = [
      { x: hexX + hexWidth / 2, y: hexY },
      { x: hexX + hexWidth, y: hexY + hexHeight / 4 },
      { x: hexX + hexWidth, y: hexY + (hexHeight * 3) / 4 },
      { x: hexX + hexWidth / 2, y: hexY + hexHeight },
      { x: hexX, y: hexY + (hexHeight * 3) / 4 },
      { x: hexX, y: hexY + hexHeight / 4 },
    ];

    const topPadding = 120;
    ctx.beginPath();
    ctx.moveTo(points[1].x, points[0].y - topPadding);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.arcTo(
      points[2].x,
      points[2].y,
      points[3].x,
      points[3].y,
      hexCornerRadius,
    );
    ctx.arcTo(
      points[3].x,
      points[3].y,
      points[4].x,
      points[4].y,
      hexCornerRadius,
    );
    ctx.arcTo(
      points[4].x,
      points[4].y,
      points[5].x,
      points[5].y,
      hexCornerRadius,
    );
    ctx.lineTo(points[5].x, points[0].y - topPadding);
    ctx.closePath();
    ctx.clip();

    const avatar = await loadImage(avatarUrl);
    const imgH = 882;
    const ratio = avatar.width / avatar.height;
    const imgW = imgH * ratio;
    ctx.drawImage(
      avatar,
      hexX + hexWidth / 2 - imgW / 2,
      hexY + hexHeight - imgH + 100,
      imgW,
      imgH,
    );
    ctx.restore();

    const textStartX = W * 0.45 + 10;
    const hexCenterY = hexY + hexHeight / 2;

    const badgeWidth = 223;
    const badgeHeight = 69;
    const badgeRadius = 12;
    const spacing = 24;

    ctx.font = "bold 128px Arial";
    const pseudoHeight = 128;
    const pseudoY = hexCenterY;
    const badgeY = pseudoY - pseudoHeight / 2 - spacing - badgeHeight;
    const badgeX = textStartX;

    const badgeColor = config.couleur[serveur] || 0x7b70ff;
    ctx.fillStyle = `#${badgeColor.toString(16).padStart(6, "0")}`;
    ctx.beginPath();
    ctx.moveTo(badgeX + badgeRadius, badgeY);
    ctx.lineTo(badgeX + badgeWidth - badgeRadius, badgeY);
    ctx.quadraticCurveTo(
      badgeX + badgeWidth,
      badgeY,
      badgeX + badgeWidth,
      badgeY + badgeRadius,
    );
    ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - badgeRadius);
    ctx.quadraticCurveTo(
      badgeX + badgeWidth,
      badgeY + badgeHeight,
      badgeX + badgeWidth - badgeRadius,
      badgeY + badgeHeight,
    );
    ctx.lineTo(badgeX + badgeRadius, badgeY + badgeHeight);
    ctx.quadraticCurveTo(
      badgeX,
      badgeY + badgeHeight,
      badgeX,
      badgeY + badgeHeight - badgeRadius,
    );
    ctx.lineTo(badgeX, badgeY + badgeRadius);
    ctx.quadraticCurveTo(badgeX, badgeY, badgeX + badgeRadius, badgeY);
    ctx.closePath();
    ctx.fill();

    const icon = await loadImage(iconPath);
    const iconHeight = icon.height;
    const iconY = badgeY + (badgeHeight - iconHeight) / 2;

    ctx.font = "32px Arial";
    const textWidth = ctx.measureText(badgeText).width;
    const spaceBetween = 16;
    const totalWidth = icon.width + spaceBetween + textWidth;
    const startX = badgeX + (badgeWidth - totalWidth) / 2;
    const iconX = startX;
    const textX = iconX + icon.width + spaceBetween;

    const contrastColor = getContrastTextColor(badgeColor);

    const tmpCanvas = createCanvas(icon.width, icon.height);
    const tmpCtx = tmpCanvas.getContext("2d");
    tmpCtx.drawImage(icon, 0, 0);
    tmpCtx.globalCompositeOperation = "source-in";
    tmpCtx.fillStyle = contrastColor;
    tmpCtx.fillRect(0, 0, icon.width, icon.height);

    ctx.drawImage(tmpCanvas, iconX, iconY, icon.width, icon.height);

    ctx.fillStyle = contrastColor;
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, textX, badgeY + badgeHeight / 2);

    const maxPseudoWidth = 1000;
    let fontSize = 128;

    ctx.font = `bold ${fontSize}px Arial`;

    while (ctx.measureText(pseudonym).width > maxPseudoWidth && fontSize > 40) {
      fontSize -= 4;
      ctx.font = `bold ${fontSize}px Arial`;
    }

    ctx.fillStyle = "#3b3e46";
    ctx.fillText(pseudonym, textStartX, pseudoY);

    ctx.fillStyle = "#8f939b";
    ctx.font = "48px Arial";
    const subtitleHeight = 48;
    const subtitleY = pseudoY + pseudoHeight / 2 + spacing + subtitleHeight / 2;
    ctx.fillStyle = "#8f939b";
    ctx.font = "48px Arial";
    const subtitleMaxWidth = 1000;
    const subtitleLineHeight = 60;
    drawWrappedText(
      ctx,
      subtitle,
      textStartX,
      subtitleY,
      subtitleMaxWidth,
      subtitleLineHeight,
    );

    const buffer = await canvas.toBuffer("image/png");

    let historique = "";

    const gradesValides = [
      "Guide",
      "Modérateur Test",
      "Modérateur",
      "Modérateur Plus",
      "Super-Modérateur",
      "Administrateur",
    ];

    const data = getData(`data/staff/${pseudonym}.json`);

    if (data) {
      historique = Object.entries(data)
        .filter(([date, details]) => gradesValides.includes(details.grade))
        .map(
          ([date, details]) =>
            `${config.emojigrade[details.grade]} **${
              details.grade
            } ${details.serveur.charAt(0).toUpperCase()}${details.serveur.slice(
              1,
            )}** : ${date}`,
        )
        .join("\n");
    }

    if (gradesValides.includes(gradeChoisi.nom)) {
      const today = new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const newEntry = `${config.emojigrade[gradeChoisi.nom]} **${
        gradeChoisi.nom
      } ${serveur.charAt(0).toUpperCase()}${serveur.slice(1)}** : ${today}`;

      historique = historique ? `${historique}\n${newEntry}` : newEntry;
    }

    const embed = new EmbedBuilder()
      .setColor(config.couleur[serveur])
      .setTitle(`${pseudonym} - ${gradeChoisi.nom}`)
      .setFooter({ text: config.footer })
      .setImage(`attachment://affiche-rank.png`);

    if (historique) {
      embed.setDescription(historique);
    }

    replyInteraction.editReply({
      embeds: [embed],
      files: [{ attachment: buffer, name: `affiche-rank.png` }],
    });

    for (const guild of interaction.client.guilds.cache.values()) {
      const member = guild.members.cache.get(membre.id);
      if (!member) continue;

      try {
        for (const roleId of rolesCategorie) {
          if (member.roles.cache.has(roleId)) {
            await member.roles.remove(roleId).catch(() => {});
          }
        }

        for (const roleId of rolesGrade) {
          if (!member.roles.cache.has(roleId)) {
            await member.roles.add(roleId).catch(() => {});
          }
        }
      } catch (err) {
        console.error(
          `Erreur lors de l'attribution ou le retrait des rôles à ${member.user.tag} sur ${guild.name} :`,
          err,
        );
      }
    }
  },
};
