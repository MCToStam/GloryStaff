const {
  SlashCommandBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const { getData } = require("../../../util/module/getAndSaveData");
const {
  errorStaffContainer,
  discordStaff,
} = require("../../../util/module/discordLink");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("routine")
    .setDescription("Effectue une routine")
    .addStringOption((option) =>
      option
        .setName("serveur")
        .setDescription("Le serveur pour lequel faire une routine")
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

    const configRoutine = getData(`data/${serveur}/config-routine.json`);

    if (!configRoutine.routine?.active) {
      const erreurEmbed = new EmbedBuilder()
        .setTitle("Erreur")
        .setColor(config.errorcolor)
        .setDescription(
          `Le système de routine n'est pas configuré sur le serveur <:NG${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }:${config.emoji[serveur.toLowerCase()]}> **${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }** !`,
        )
        .setFooter({ text: config.footer });
      return interaction.reply({ embeds: [erreurEmbed], ephemeral: true });
    }

    if (
      !configRoutine.routine?.Salon.valeur ||
      !configRoutine.routine?.Grade.valeur
    ) {
      const erreurEmbed = new EmbedBuilder()
        .setTitle("Erreur")
        .setColor(config.errorcolor)
        .setDescription(
          `Le système de routine n'est pas complètement configuré sur le serveur <:NG${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }:${config.emoji[serveur.toLowerCase()]}> **${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }** !`,
        )
        .setFooter({ text: config.footer });
      return interaction.reply({ embeds: [erreurEmbed], ephemeral: true });
    }

    const roleAutorise = configRoutine.routine.Grade.valeur;

    const gradeAutorise = {
      Administrateur: "administrateur",
      "Super-Modérateur": "super_moderateur",
      "Modérateur Plus": "moderateur_plus",
      Modérateur: "moderateur",
      "Modérateur Test": "moderateur_test",
      Guide: "guide",
    };

    const { pseudo, servers, container } = await discordStaff(
      interaction.user.id,
      serveur,
      gradeAutorise[roleAutorise],
    );

    if (container) {
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const imageUrl = `https://skins.nationsglory.fr/body/${pseudo}/3d/4?vr=-20&hr=10&hrh=20&vrla=50&vrra=-10&vrll=-10&vrrl=20&ratio=12&format=png&displayHair=true&headOnly=false&layers=false`;
    const response = await fetch(imageUrl);

    const buffer = Buffer.from(await response.arrayBuffer());

    const image = await loadImage(buffer);

    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");

    ctx.scale(-1, 1);
    ctx.drawImage(image, -image.width, 0);

    const flippedImageBuffer = canvas.toBuffer();

    const embed = new EmbedBuilder()
      .setTitle(`⏱️ Routine - ${pseudo.replace(/_/g, "\\_")}`)
      .setColor(config.couleur[serveur])
      .setDescription(
        `**Début de la routine :** <t:${Math.floor(
          Date.now() / 1000,
        )}:R>\n**Infractions :**\n**Fin de la routine :**`,
      )
      .setFooter({ text: config.footer })
      .setThumbnail("attachment://modele.png");

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("routine")
      .setPlaceholder("Sélectionnez une infraction")
      .addOptions([
        {
          label: "Bunker Illégal",
          value: "routine_bunkerillegal",
          emoji: "1333876277651705878",
        },
        {
          label: "Anti-AFK",
          value: "routine_antiafk",
          emoji: "1333876277651705878",
        },
        {
          label: "Auto-Clic",
          value: "routine_autoclic",
          emoji: "1333876277651705878",
        },
        {
          label: "Stack Item",
          value: "routine_stackitem",
          emoji: "1333876277651705878",
        },
        {
          label: "AutoNuke Illégal",
          value: "routine_autonukeillegal",
          emoji: "1333876277651705878",
        },
        { label: "XRay", value: "routine_xray", emoji: "1333876277651705878" },
        {
          label: "Autre",
          value: "routine_autre",
          emoji: "1333876277651705878",
        },
      ]);

    const buttonFinish = new ButtonBuilder()
      .setCustomId(`routine_finish-${pseudo}`)
      .setLabel("Terminer la Routine")
      .setStyle(ButtonStyle.Success);

    const actionRow1 = new ActionRowBuilder().addComponents(selectMenu);
    const actionRow2 = new ActionRowBuilder().addComponents(buttonFinish);

    interaction.editReply({
      embeds: [embed],
      files: [{ attachment: flippedImageBuffer, name: "modele.png" }],
      components: [actionRow1, actionRow2],
      ephemeral: true,
    });
  },
};
