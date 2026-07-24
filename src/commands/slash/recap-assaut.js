const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { discordStaff } = require("../../../util/module/discordLink");
const proxyCommande = require("../../../util/proxy/proxyCommande");
const Configuration = require("../../../util/database/models/Configuration");
const RecapitulatifAssaut = require("../../../util/database/models/RecapitulatifAssaut");
const {
  buildErrorContainer,
  sendTemporaryError,
  sendTemporaryMessage,
} = require("../../../util/proxy/reply");
const {
  getCachedEmojiTete,
  getCachedEmojiDrapeau,
  getEmojiTete,
  getEmojiDrapeau,
} = require("../../../util/module/emoji");

function getTimeZoneOffsetMs(timeZone, date) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = dtf.formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return asUTC - date.getTime();
}

function parseDateDiscord(dateString) {
  if (!dateString) return null;

  const match = dateString.match(
    /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2})[h:](\d{2})$/,
  );

  if (!match) return null;

  const [, jour, mois, annee, heure, minute] = match;

  const wallClockAsUTC = Date.UTC(
    Number(annee),
    Number(mois) - 1,
    Number(jour),
    Number(heure),
    Number(minute),
  );

  const offset = getTimeZoneOffsetMs("Europe/Paris", new Date(wallClockAsUTC));

  const realTimestampMs = wallClockAsUTC - offset;

  return Math.floor(realTimestampMs / 1000);
}

module.exports = {
  config: { permission: "moderateur_test" },
  data: new SlashCommandBuilder()
    .setContexts(0)
    .setName("recap-assaut")
    .setDescription("Envoie le récapitulatif d'une surveillance d'un assaut")
    .addStringOption((option) =>
      option
        .setName("pays_attaquant")
        .setDescription("Pays attaquant dans l'assaut")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("pays_defenseur")
        .setDescription("Pays défenseur dans l'assaut")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("date")
        .setDescription("Date du début de l'assaut (ex: 25/12/2026 18:00)")
        .setRequired(true),
    ),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur, pays_attaquant, pays_defenseur, date } =
      interaction.parametre;

    const timestamp = parseDateDiscord(date);

    if (date && !timestamp) {
      const errorContainer = buildErrorContainer(
        config,
        "❌ Format Invalide",
        "Utilise : `JJ/MM/AAAA HHhMM` ou `JJ/MM/AAAA HH:MM`\nExemple : `19/06/2026 20h30`",
      );

      return sendTemporaryError(interaction, errorContainer);
    }

    const configAssaut = await Configuration.findOne({
      serveur,
      guildId: interaction.guild.id,
      categorie: "Récapitulatif Assaut",
      systeme: "Récapitulatif Assaut",
    });

    if (!configAssaut || !configAssaut.active) {
      const errorContainer = buildErrorContainer(
        config,
        "❌ Système Désactivé",
        `Le système de Récapitulatif d'Assaut est désactivé sur le serveur ${
          config.serveur[serveur].emoji_formate
        } ${config.serveur[serveur].nom} pour votre serveur Discord.`,
      );

      return sendTemporaryError(interaction, errorContainer);
    }

    const salonId = configAssaut.data.get("Salon");
    const grade = configAssaut.data.get("Grade");

    if (!salonId || !grade) {
      const errorContainer = buildErrorContainer(
        config,
        "❌ Configuration Invalide",
        `Le système de Récapitulatif d'Assaut n'est pas correctement configuré sur le serveur ${config.serveur[serveur].name} pour votre serveur Discord.`,
      );

      return sendTemporaryError(interaction, errorContainer);
    }

    const { pseudonym, container } = await discordStaff(
      interaction.user.id,
      serveur,
      grade,
    );

    if (container) return sendTemporaryError(interaction, container);

    const recap = await RecapitulatifAssaut.create({
      serveur,
      paysAttaquant: pays_attaquant,
      paysDefenseur: pays_defenseur,
      date: new Date(timestamp * 1000),
      staff: [pseudonym],
      explosion: [],
      acte_illegal: [],
      sent: false,
    });

    const userContainer = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((t) =>
        t.setContent("## 🪖 Récapitulatif Assaut"),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `**<:pays_attaquant:1529051695915732992> Pays Attaquant :** ${pays_attaquant}\n**<:pays_defenseur:1529051696976891904> Pays Défenseur :** ${pays_defenseur}\n**📅 Date de début :** <t:${timestamp}:F> • <t:${timestamp}:R>`,
        ),
      )
      .addSeparatorComponents((s) => s)
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              `**Staff${recap.staff.length > 1 ? "s" : ""} ayant surveillé${recap.staff.length > 1 ? "s" : ""} l'assaut :**\n${recap.staff.length === 0 ? "Aucun staff enregistré" : recap.staff.join(", ")}`,
            ),
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(`recap_assaut-staff-${recap._id}`)
              .setLabel("🚨 Modifier les Staffs")
              .setStyle(ButtonStyle.Primary),
          ),
      )
      .addSeparatorComponents((s) => s)
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              `**Explosion${recap.explosion.length > 1 ? "s" : ""} ayant été causée${recap.explosion.length > 1 ? "s" : ""} durant l'assaut :**${recap.explosion.length === 0 ? "\nAucune explosion enregistrée" : ""}`,
            ),
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(`recap_assaut-explosion-${recap._id}`)
              .setLabel("💥 Ajouter une Explosion")
              .setStyle(ButtonStyle.Primary),
          ),
      );

    for (const explosion in recap.explosion) {
      userContainer.addSectionComponents((section) =>
        section
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              `**${explosion.type}** aux coordonnées **X=${explosion.x}** et **Z=${explosion.z}**`,
            ),
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(
                `recap_assaut_explosion_delete-${explosion.type}-${explosion.y}-${explosion.z}`,
              )
              .setLabel("🗑️ Supprimer l'Explosion")
              .setStyle(ButtonStyle.Danger),
          ),
      );
    }

    userContainer
      .addSeparatorComponents((s) => s)
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              `**Acte${recap.acte_illegal.length > 1 ? "s" : ""} illéga${recap.acte_illegal.length > 1 ? "ux" : "l"} durant l'assaut :**${recap.acte_illegal.length === 0 ? "\nAucun acte illégal enregistré" : ""}`,
            ),
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(`recap_assaut-acte_illegal-${recap._id}`)
              .setLabel("🧑‍⚖️ Ajouter un Acte Illégal")
              .setStyle(ButtonStyle.Primary),
          ),
      );

    for (const acte_illegal in recap.acte_illegal) {
      userContainer.addSectionComponents((section) =>
        section
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(`${acte_illegal}`),
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(`recap_assaut_acte_illegal_delete-${acte_illegal}`)
              .setLabel("🗑️ Supprimer l'Acte Illégal")
              .setStyle(ButtonStyle.Danger),
          ),
      );
    }

    userContainer
      .addSeparatorComponents((s) => s)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`recap_assaut_envoyer-${recap.id}`)
            .setLabel("📨 Envoyer le Récapitulatif d'Assaut")
            .setStyle(ButtonStyle.Success),
        ),
      );

    sendTemporaryMessage(interaction, userContainer);
  },
};
