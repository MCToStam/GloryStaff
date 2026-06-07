const {
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const { getServeur } = require("../../../util/module/getServeur");
const { getEmojiTete } = require("../../../util/module/emoji");
const Configuration = require("../../../util/database/models/Configuration");
const Absense = require("../../../util/database/models/Absence");
const CONFIG_STATIC = require("../../../util/config");

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

    if (!configStaff?.active) {
      const container = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((t) =>
          t.setContent("## ❌ Configuration Manquante"),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent("Le système est désactivé ou mal configuré."),
        );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const staffServeur = require(`../../../data/${serveur}/staff-serveur.json`);

    const processedData = {
      Administrateur: staffServeur["Administrateur"] || [],
      "Super-Modérateur": staffServeur["Super-Modérateur"] || [],
      "Modérateur Plus": staffServeur["Modérateur Plus"] || [],
      Modérateur: staffServeur["Modérateur"] || [],
      "Modérateur Test": staffServeur["Modérateur Test"] || [],
      Guide: staffServeur["Guide"] || [],
    };

    const GRADES = [
      "Administrateur",
      "Super-Modérateur",
      "Modérateur Plus",
      "Modérateur",
      "Modérateur Test",
      "Guide",
    ];

    const escapeUnderscore = (text = "") => text.replace(/_/g, "\\_");

    const effectifRole = (role) =>
      (processedData[role] || []).filter((n) => n?.trim()).length;

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
      const membres = processedData[grade] || [];

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

      const color = config.grade?.[grade]
        ? parseInt(config.grade[grade].replace("#", ""), 16)
        : null;

      const nbEffectif = effectifRole(grade);

      let nomGrade = grade + (nbEffectif > 1 ? "s" : "");
      if (grade === "Modérateur Plus" && nbEffectif > 1)
        nomGrade = "Modérateurs Plus";

      const container = new ContainerBuilder()
        .setAccentColor(color || config.colors.success)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `### ${config.emojigrade?.[grade] || ""} ${nomGrade} (${nbEffectif}) :`,
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

      if (grade === "Guide") {
        container.addSeparatorComponents((s) => s);

        container.addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setURL(configCandidature.systeme.Guide.lien[serveur])
              .setLabel("Recrutement Guide")
              .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
              .setURL(configCandidature.systeme.Modérateur.lien[serveur])
              .setLabel("Recrutement Modérateur")
              .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
              .setURL(configCandidature.systeme.Builder.lien[serveur])
              .setLabel("Recrutement Builder")
              .setStyle(ButtonStyle.Link),
          ),
        );
      }

      components.push(container);
    }

    return interaction.reply({
      components,
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
