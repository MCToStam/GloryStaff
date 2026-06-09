const {
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const { getServeur } = require("../../../../util/module/getServeur");
const { getEmojiTete } = require("../../../../util/module/emoji");
const Configuration = require("../../../../util/database/models/Configuration");
const Absense = require("../../../../util/database/models/Absence");
const Serveur = require("../../../../util/database/models/Serveur");
const CONFIG_STATIC = require("../../../../util/config");

module.exports = {
  data: {
    name: "affichage_staff",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);

    const configStaff = await Configuration.findOne({
      serveur,
      guildId: interaction.guild.id,
      categorie: "Staff",
      systeme: "Affichage Staff",
    });

    if (!configStaff?.active || !configStaff.data.get("Salon")) {
      const container = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((t) =>
          t.setContent("## ❌ Configuration Manquante"),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            "Le système est désactivé ou le salon n'est pas défini.",
          ),
        );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const staffServeur = await Serveur.findOne({
      serveur,
    }).lean();

    const GRADES = Object.entries(config.grade)
      .sort(([, a], [, b]) => b.priorite - a.priorite)
      .map(([grade]) => grade);

    const escapeUnderscore = (text = "") => text.replace(/_/g, "\\_");

    const now = new Date();

    const absenceData = await Absense.find({
      serveur,
      debut: { $lte: now },
      $or: [{ fin: null }, { fin: { $gt: now } }],
    });

    const absents = new Set(absenceData.map((a) => a.staff));

    const components = [];

    const configCandidature = CONFIG_STATIC.find(
      (c) => c.nom === "Candidature",
    );

    for (const grade of GRADES) {
      const membres = staffServeur.staff[grade] || [];

      const membresPresents = membres.filter((m) => !absents.has(m));
      const membresAbsents = membres.filter((m) => absents.has(m));

      const membresText =
        membresPresents.length > 0
          ? (
              await Promise.all(
                membresPresents.map(async (m) => {
                  const emoji = (await getEmojiTete(client, m)) || "🧑";
                  return `${emoji} ${escapeUnderscore(m)}`;
                }),
              )
            ).join(", ")
          : "Aucun";

      const color = config.grade[grade].couleur
        ? parseInt(config.grade[grade].couleur.replace("#", ""), 16)
        : null;

      const nomGrade =
        membres.length > 1
          ? config.grade[grade].nom.pluriel
          : config.grade[grade].nom.normal;

      const container = new ContainerBuilder()
        .setAccentColor(color || config.colors.success)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `### <:${grade}:${config.grade[grade].emoji}> ${nomGrade} (${membres.length}) :`,
          ),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) => t.setContent(membresText));

      if (membresAbsents.length > 0) {
        const absentsText = (
          await Promise.all(
            membresAbsents.map(async (m) => {
              const emoji = (await getEmojiTete(client, m)) || "🧑";
              return `${emoji} ${escapeUnderscore(m)}`;
            }),
          )
        ).join(", ");

        container
          .addSeparatorComponents((s) => s)
          .addTextDisplayComponents((t) =>
            t.setContent(
              `**⏰ Absent${membresAbsents.length > 1 ? "s" : ""} :** ${absentsText}`,
            ),
          );
      }

      if (grade === GRADES[GRADES.length - 1]) {
        container
          .addSeparatorComponents((s) => s)
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setURL(configCandidature.systeme.Guide.lien[serveur])
                .setLabel("Recrutement Guide")
                .setEmoji(config.grade.guide.emoji)
                .setStyle(ButtonStyle.Link),
              new ButtonBuilder()
                .setURL(configCandidature.systeme.Modérateur.lien[serveur])
                .setLabel("Recrutement Modérateur")
                .setEmoji(config.grade.moderateur.emoji)
                .setStyle(ButtonStyle.Link),
              new ButtonBuilder()
                .setURL(configCandidature.systeme.Builder.lien[serveur])
                .setLabel("Recrutement Builder")
                .setEmoji("1458468397963808872")
                .setStyle(ButtonStyle.Link),
            ),
          );
      }

      components.push(container);
    }

    const salon = await client.channels.fetch(configStaff.data.get("Salon"));

    const message = await salon.send({
      components,
      flags: MessageFlags.IsComponentsV2,
    });

    const messageLink = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;

    configStaff.data.set("messageId", message.id);
    configStaff.save();

    const userContainer = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((t) => t.setContent("## 📋 Affichage Staff"))
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `L'affichage staff a correctement été envoyé ici : ${messageLink}`,
        ),
      );

    await interaction.editReply({
      components: [userContainer],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
