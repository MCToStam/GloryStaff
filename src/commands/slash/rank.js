const { createCanvas, loadImage } = require("canvas");
const {
  getAbsolutePath,
  getData,
} = require("../../../util/module/getAndSaveData");
const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
  EmbedBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const { discordLink } = require("../../../util/module/discordLink");
const proxyCommande = require("../../../util/proxy/proxyCommande");
const Grade = require("../../../util/database/models/Grade");

// ---------- Color helpers ----------

function hexToRgb(color) {
  const hex =
    typeof color === "number"
      ? color.toString(16).padStart(6, "0")
      : String(color).replace("#", "");
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function rgba({ r, g, b }, a = 1) {
  return `rgba(${r},${g},${b},${a})`;
}

function mixColor(a, b, ratio) {
  return {
    r: Math.round(a.r * ratio + b.r * (1 - ratio)),
    g: Math.round(a.g * ratio + b.g * (1 - ratio)),
    b: Math.round(a.b * ratio + b.b * (1 - ratio)),
  };
}

function getContrastTextColor(colorNumber) {
  const { r, g, b } = hexToRgb(colorNumber);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 180 ? "#55545B" : "#FBF0CA";
}

// ---------- Text helpers ----------

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let offsetY = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + (line ? " " : "") + words[n];
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line, x, y + offsetY);
      line = words[n];
      offsetY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y + offsetY);
}

// Manually-tracked (letter-spaced) text, canvas has no native letter-spacing
function fillTextTracked(ctx, text, x, y, spacing) {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
  return cx - spacing;
}

function measureTrackedWidth(ctx, text, spacing) {
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + spacing;
  return w - spacing;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

module.exports = {
  config: { permission: "super_moderateur" },
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Rank une personne")
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
    )
    .addStringOption((option) =>
      option
        .setName("afficher_historique")
        .setDescription("Afficher l'historique des grades")
        .setRequired(true)
        .addChoices(
          { name: "Oui", value: "oui" },
          { name: "Non", value: "non" },
        ),
    ),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },

  async proxy(client, interaction, config) {
    const { serveur, grade, pseudo, afficher_historique } =
      interaction.parametre;

    const utilisateur = interaction.guild.members.cache.get(pseudo);

    const doc = await Grade.findOne({ serveur });

    async function sendError(target, message) {
      const errorContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((t) => t.setContent("## ❌ Grade Invalide"))
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) => t.setContent(message));

      if (target.isMessageComponent()) {
        const sent = await target.update({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
          withResponse: true,
        });
        setTimeout(async () => {
          try {
            await (sent.resource?.message ?? sent).delete();
          } catch {}
        }, 5_000);
      } else {
        await target.reply({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
    }

    if (!doc) {
      return sendError(
        interaction,
        "Aucune configuration de grade trouvée sur ce serveur.",
      );
    }

    let gradeChoisi = null;
    let categorieChoisie = null;

    if (grade.includes("_")) {
      const [catId, gradeId] = grade.split("_");
      const cat = doc.categorie.find((c) => c.id === catId);
      const found = cat?.grade.find((g) => g.id === gradeId);
      if (found) {
        categorieChoisie = cat;
        gradeChoisi = found;
      }
    }

    if (!gradeChoisi) {
      const matches = doc.categorie.flatMap((cat) =>
        cat.grade
          .filter((g) => g.nom.toLowerCase() === grade.toLowerCase())
          .map((g) => ({ grade: g, categorie: cat })),
      );

      if (matches.length !== 1) {
        return sendError(
          interaction,
          "Le grade spécifié n'a pas été trouvé ou est ambigu sur ce serveur.",
        );
      }

      gradeChoisi = matches[0].grade;
      categorieChoisie = matches[0].categorie;
    }

    const rolesCategorie = categorieChoisie.grade.flatMap((g) => g.role || []);
    const rolesGrade = gradeChoisi.role || [];

    let pseudonym = await discordLink(pseudo);
    let replyInteraction;

    if (pseudonym) {
      if (interaction.isMessageComponent()) {
        await interaction.deferUpdate();
      } else {
        await interaction.deferReply();
      }
      replyInteraction = interaction;
    } else {
      const modal = new ModalBuilder()
        .setCustomId("rankModal_" + pseudo)
        .setTitle("Choisissez le pseudonyme de la personne")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("pseudonymInput")
              .setLabel(`Pseudonyme de ${utilisateur.displayName}`)
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMaxLength(32),
          ),
        );

      await interaction.showModal(modal);

      try {
        const submitted = await interaction.awaitModalSubmit({
          filter: (i) =>
            i.customId === "rankModal_" + pseudo &&
            i.user.id === interaction.user.id,
          time: 120_000,
        });

        pseudonym = submitted.fields.getTextInputValue("pseudonymInput").trim();

        const response = await fetch(`${config.glorybot_url}/api/ng-link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discord_id: pseudo, pseudo_ng: pseudonym }),
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          const isUserNotFound =
            typeof data.error === "string" &&
            data.error.startsWith(
              "L'utilisateur que vous recherchez n'existe pas",
            );

          return submitted.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle(`❌ Liaison échouée - ${pseudonym}`)
                .setDescription(
                  data.error ||
                    (isUserNotFound
                      ? "Utilisateur introuvable."
                      : "Erreur inconnue."),
                )
                .setColor(config.colors.error),
            ],
            ephemeral: true,
          });
        }

        if (interaction.isMessageComponent()) {
          await submitted.deferUpdate();
        } else {
          await submitted.deferReply();
        }
        replyInteraction = submitted;
      } catch {
        return interaction.followUp({
          content:
            "Vous n'avez pas renseigné de pseudonyme ou le délai est écoulé. La commande a été annulée.",
          ephemeral: true,
        });
      }
    }

    const subtitle = gradeChoisi.subtitle_rank;
    const badgeText = config.serveur[serveur].nom;
    const iconPath = getAbsolutePath(
      config.liste_serveur_bedrock.includes(serveur)
        ? "data/icon-bedrock.png"
        : "data/icon-java.png",
    );
    const avatarUrl = `https://skins.nationsglory.fr/body/${pseudonym}/3d/4?vr=-20&hr=10&hrh=20&vrla=50&vrra=-10&vrll=-10&vrrl=20&ratio=12&format=png&displayHair=true&headOnly=false&layers=false`;

    // Rank tier among the hierarchy (needed both for the visual + historique)
    const gradesValides = Object.entries(config.grade)
      .sort(([, a], [, b]) => b.priorite - a.priorite)
      .map(([grade]) => grade.nom);

    const tierIndex = gradesValides.indexOf(gradeChoisi.nom);
    const tierTotal = gradesValides.length;

    // ---------- Canvas ----------

    const W = 1920;
    const H = 1080;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    const gradeRgb = hexToRgb(gradeChoisi.couleur);
    const darkBase = { r: 13, g: 14, b: 18 };
    const darkerBase = { r: 8, g: 9, b: 12 };

    // 1. Base gradient, tinted by the grade color
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, rgba(mixColor(gradeRgb, darkBase, 0.4), 1));
    bgGrad.addColorStop(0.55, rgba(darkBase, 1));
    bgGrad.addColorStop(1, rgba(darkerBase, 1));
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Diagonal light streak for movement
    ctx.save();
    ctx.translate(W * 0.72, H * 0.15);
    ctx.rotate((-14 * Math.PI) / 180);
    const streakGrad = ctx.createLinearGradient(-260, 0, 260, 0);
    streakGrad.addColorStop(0, "rgba(255,255,255,0)");
    streakGrad.addColorStop(0.5, rgba(gradeRgb, 0.14));
    streakGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = streakGrad;
    ctx.fillRect(-260, -200, 520, H * 1.8);
    ctx.restore();

    // 3. Giant faint watermark letter (first letter of the grade name)
    ctx.save();
    ctx.font = "900 760px Arial";
    ctx.fillStyle = rgba(gradeRgb, 0.07);
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    ctx.fillText(
      (gradeChoisi.nom || "?").charAt(0).toUpperCase(),
      W + 90,
      H * 0.52,
    );
    ctx.textAlign = "left";
    ctx.restore();

    // 4. Vignette
    const vGrad = ctx.createRadialGradient(
      W / 2,
      H / 2,
      H * 0.25,
      W / 2,
      H / 2,
      W * 0.8,
    );
    vGrad.addColorStop(0, "rgba(0,0,0,0)");
    vGrad.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, W, H);

    // 5. Avatar glow + avatar with a soft bottom fade (no hard hex crop)
    const avatar = await loadImage(avatarUrl);
    const imgH = 900;
    const imgW = imgH * (avatar.width / avatar.height);
    const avatarX = W * 0.18 - imgW / 2;
    const avatarY = H - imgH + 70;

    const glowCx = avatarX + imgW / 2;
    const glowCy = avatarY + imgH * 0.42;
    const glowGrad = ctx.createRadialGradient(
      glowCx,
      glowCy,
      0,
      glowCx,
      glowCy,
      imgH * 0.62,
    );
    glowGrad.addColorStop(0, rgba(gradeRgb, 0.4));
    glowGrad.addColorStop(1, rgba(gradeRgb, 0));
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(glowCx, glowCy, imgH * 0.62, 0, Math.PI * 2);
    ctx.fill();

    const avatarCanvas = createCanvas(imgW, imgH);
    const avatarCtx = avatarCanvas.getContext("2d");
    avatarCtx.drawImage(avatar, 0, 0, imgW, imgH);
    const fadeMask = avatarCtx.createLinearGradient(0, 0, 0, imgH);
    fadeMask.addColorStop(0, "rgba(255,255,255,1)");
    fadeMask.addColorStop(0.85, "rgba(255,255,255,1)");
    fadeMask.addColorStop(1, "rgba(255,255,255,0)");
    avatarCtx.globalCompositeOperation = "destination-in";
    avatarCtx.fillStyle = fadeMask;
    avatarCtx.fillRect(0, 0, imgW, imgH);
    ctx.drawImage(avatarCanvas, avatarX, avatarY, imgW, imgH);

    // 6. Right-side text panel
    const textStartX = W * 0.44;

    // Badge pill (server)
    const badgeY = 150;
    const badgeHeight = 62;
    const icon = await loadImage(iconPath);
    ctx.font = "26px Arial";
    const badgeTextWidth = measureTrackedWidth(ctx, badgeText.toUpperCase(), 2);
    const badgePaddingX = 26;
    const badgeWidth = icon.width + 16 + badgeTextWidth + badgePaddingX * 2;

    const badgeColor = config.serveur[serveur].couleur || 0x7b70ff;
    const badgeRgb = hexToRgb(badgeColor);

    drawRoundedRect(ctx, textStartX, badgeY, badgeWidth, badgeHeight, badgeHeight / 2);
    ctx.fillStyle = rgba(badgeRgb, 0.16);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = rgba(badgeRgb, 0.6);
    ctx.stroke();

    const contrastColor = getContrastTextColor(badgeColor) === "#55545B"
      ? rgba(badgeRgb, 1)
      : "#FBF0CA";

    const tmpIcon = createCanvas(icon.width, icon.height);
    const tmpIconCtx = tmpIcon.getContext("2d");
    tmpIconCtx.drawImage(icon, 0, 0);
    tmpIconCtx.globalCompositeOperation = "source-in";
    tmpIconCtx.fillStyle = rgba(badgeRgb, 1);
    tmpIconCtx.fillRect(0, 0, icon.width, icon.height);

    const iconY = badgeY + (badgeHeight - icon.height) / 2;
    ctx.drawImage(tmpIcon, textStartX + badgePaddingX, iconY);
    ctx.fillStyle = rgba(badgeRgb, 1);
    ctx.textBaseline = "middle";
    fillTextTracked(
      ctx,
      badgeText.toUpperCase(),
      textStartX + badgePaddingX + icon.width + 16,
      badgeY + badgeHeight / 2,
      2,
    );

    // Rank progress bar
    const barY = badgeY + badgeHeight + 46;
    const barWidth = 320;
    const barHeight = 6;

    ctx.font = "22px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    fillTextTracked(ctx, "PROGRESSION DU GRADE", textStartX, barY - 20, 3);

    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "bold 22px Arial";
    ctx.fillText(
      `${tierIndex >= 0 ? tierIndex + 1 : "?"} / ${tierTotal}`,
      textStartX + barWidth,
      barY - 20,
    );
    ctx.textAlign = "left";

    drawRoundedRect(ctx, textStartX, barY, barWidth, barHeight, barHeight / 2);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fill();

    if (tierIndex >= 0 && tierTotal > 0) {
      const fillWidth = Math.max(
        barHeight,
        (barWidth * (tierIndex + 1)) / tierTotal,
      );
      const barGrad = ctx.createLinearGradient(
        textStartX,
        0,
        textStartX + fillWidth,
        0,
      );
      barGrad.addColorStop(0, rgba(gradeRgb, 0.5));
      barGrad.addColorStop(1, rgba(gradeRgb, 1));
      drawRoundedRect(ctx, textStartX, barY, fillWidth, barHeight, barHeight / 2);
      ctx.fillStyle = barGrad;
      ctx.fill();
    }

    // Pseudonym
    let fontSize = 132;
    ctx.font = `bold ${fontSize}px Arial`;
    while (ctx.measureText(pseudonym).width > 980 && fontSize > 48) {
      fontSize -= 4;
      ctx.font = `bold ${fontSize}px Arial`;
    }

    const pseudoY = barY + 150;
    ctx.shadowColor = rgba(gradeRgb, 0.5);
    ctx.shadowBlur = 30;
    ctx.fillStyle = "#F5F6F8";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(pseudonym, textStartX, pseudoY);
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    // Accent line under the name
    const lineY = pseudoY + 34;
    const lineGrad = ctx.createLinearGradient(
      textStartX,
      0,
      textStartX + 140,
      0,
    );
    lineGrad.addColorStop(0, rgba(gradeRgb, 1));
    lineGrad.addColorStop(1, rgba(gradeRgb, 0.1));
    drawRoundedRect(ctx, textStartX, lineY, 140, 5, 2.5);
    ctx.fillStyle = lineGrad;
    ctx.fill();

    // Subtitle
    ctx.font = "34px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    const subtitleY = lineY + 56;
    drawWrappedText(
      ctx,
      subtitle ? subtitle.toUpperCase() : "",
      textStartX,
      subtitleY,
      900,
      50,
    );

    const buffer = await canvas.toBuffer("image/png");

    // ---------- Historique ----------

    const staffData = getData(`data/staff/${pseudonym}.json`);
    let historique = "";

    if (staffData) {
      historique = Object.entries(staffData)
        .filter(([, details]) => gradesValides.includes(details.grade))
        .map(
          ([date, details]) =>
            `${config.emojigrade[details.grade]} **${details.grade} ${
              config.serveur[serveur].nom
            }** : ${date}`,
        )
        .join("\n");
    }

    if (gradesValides.includes(gradeChoisi.nom)) {
      const today = new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const newEntry = `${config.emojigrade[gradeChoisi.nom]} **${gradeChoisi.nom} ${
        config.serveur[serveur].nom
      }** : ${today}`;
      historique = historique ? `${historique}\n${newEntry}` : newEntry;
    }

    const embed = new EmbedBuilder()
      .setColor(config.serveur[serveur].couleur)
      .setTitle(`${pseudonym} - ${gradeChoisi.nom}`)
      .setImage(`attachment://affiche-rank.png`);

    if (historique && afficher_historique === "oui") {
      embed.setDescription(historique);
    }

    const channel = await client.channels.fetch(interaction.channelId);
    const messagePayload = {
      embeds: [embed],
      files: [{ attachment: buffer, name: "affiche-rank.png" }],
    };

    if (categorieChoisie.role.length > 0) {
      messagePayload.content = categorieChoisie.role
        .map((r) => `<@&${r}>`)
        .join(" ");
    }

    await channel.send(messagePayload);

    for (const guild of interaction.client.guilds.cache.values()) {
      const member = guild.members.cache.get(pseudo);
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
          `Erreur attribution des rôles à ${member.user.tag} sur ${guild.name} :`,
          err,
        );
      }
    }

    const userContainer = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((t) => t.setContent("## ⬆️ Rank"))
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(`Le message de rank de <@${pseudo}> a bien été envoyé !`),
      );

    const sentMessage = await replyInteraction.editReply({
      components: [userContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] },
      withResponse: true,
    });

    setTimeout(async () => {
      try {
        await (sentMessage.resource?.message ?? sentMessage).delete();
      } catch {}
    }, 5_000);
  },
};