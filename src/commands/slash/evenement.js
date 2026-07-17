const {
  SlashCommandBuilder,
  ContainerBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  AttachmentBuilder,
  TextDisplayBuilder,
} = require("discord.js");
const { discordStaff } = require("../../../util/module/discordLink");
const proxyCommande = require("../../../util/proxy/proxyCommande");
const Evenement = require("../../../util/database/models/Evenement");
const Configuration = require("../../../util/database/models/Configuration");
const {
  buildErrorContainer,
  sendTemporaryError,
  replyOrUpdate,
} = require("../../../util/proxy/reply");
const {
  getCachedEmojiTete,
  getEmojiTete,
} = require("../../../util/module/emoji");

const EVENEMENTS_PAR_PAGE = 5;

function formatCreateurs(createurs, teteEmojis) {
  return createurs
    .map(
      (pseudo) =>
        `${teteEmojis.get(pseudo) || "<:tete_default:1517896405841215619>"} ${pseudo}`,
    )
    .join(", ");
}

function buildEvenementLancerComponents({
  evenementData,
  configEvenement,
  config,
  serveur,
  date,
  timestamp,
  fileName,
  teteEmojis,
}) {
  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
    .addTextDisplayComponents((t) =>
      t.setContent(`## ${evenementData.emoji ?? "🎉"} ${evenementData.nom}`),
    )
    .addSeparatorComponents((s) => s);

  if (evenementData.description) {
    container.addTextDisplayComponents((t) =>
      t.setContent(`**💬 Description :** ${evenementData.description}`),
    );
  }

  if (evenementData.createur.length > 0) {
    const createurTexte = evenementData.createur
      .map((pseudo) => `${teteEmojis.get(pseudo) || "🧑"} ${pseudo}`)
      .join(", ");

    container.addTextDisplayComponents((t) =>
      t.setContent(
        `**🏗️ Créateur${evenementData.createur.length > 1 ? "s" : ""} :** ${createurTexte}`,
      ),
    );
  }

  if (date) {
    container.addTextDisplayComponents((t) =>
      t.setContent(
        `**📅 Démarrage le <t:${timestamp}:F> • <t:${timestamp}:R>**`,
      ),
    );
  }

  if (evenementData.image?.data) {
    container
      .addSeparatorComponents((s) => s)
      .addMediaGalleryComponents((m) =>
        m.addItems((item) => item.setURL(`attachment://${fileName}`)),
      );
  }

  let components = [container];
  if (configEvenement?.data?.get("Role")?.length > 0) {
    const roleMentions = configEvenement.data
      .get("Role")
      .map((roleId) => `<@&${roleId}>`)
      .join(", ");

    const roleTextDisplay = new TextDisplayBuilder().setContent(roleMentions);
    components = [roleTextDisplay, container];
  }

  return components;
}

function buildEvenementAleatoireComponents({
  evenementsSelectionnes,
  configEvenement,
  config,
  serveur,
  nb_evenement,
  timestamp,
  date,
  teteEmojis,
}) {
  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `## 🎈 Événement${evenementsSelectionnes.length > 1 ? "s" : ""} du Jour`,
      ),
    )
    .addSeparatorComponents((s) => s);

  const texte = configEvenement?.data?.get("Texte Affiché")?.[0];

  if (texte) {
    const safeTimestamp = timestamp || Math.floor(Date.now() / 1000);
    const dateStr = new Date(safeTimestamp * 1000).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const texteRemplace = texte
      .replaceAll("{nbEvent}", nb_evenement)
      .replaceAll("{date}", dateStr);

    container
      .addTextDisplayComponents((t) => t.setContent(texteRemplace))
      .addSeparatorComponents((s) => s);
  }

  for (const evenementData of evenementsSelectionnes) {
    const createurTexte =
      evenementData.createur.length > 0
        ? `\n- Créé par ${formatCreateurs(evenementData.createur, teteEmojis)}`
        : "";

    container.addTextDisplayComponents((t) =>
      t.setContent(
        `**${evenementData.emoji ?? "🎉"} ${evenementData.nom}**${evenementData.description ? `\n> *${evenementData.description}*` : ""}${createurTexte}`,
      ),
    );
  }

  if (date) {
    container
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `**📅 Démarrage le <t:${timestamp}:F> • <t:${timestamp}:R>**`,
        ),
      );
  }

  let components = [container];
  if (configEvenement?.data?.get("Role")?.length > 0) {
    const roleMentions = configEvenement.data
      .get("Role")
      .map((roleId) => `<@&${roleId}>`)
      .join(", ");

    const roleTextDisplay = new TextDisplayBuilder().setContent(roleMentions);
    components = [roleTextDisplay, container];
  }

  return components;
}

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
  config: { permission: "moderateur_plus" },
  data: new SlashCommandBuilder()
    .setContexts(0)
    .setName("evenement")
    .setDescription("Gestion des événements")
    .addSubcommand((sub) =>
      sub
        .setName("gérer")
        .setDescription("Créer, modifier ou supprimer des événements"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("lancer")
        .setDescription("Annonce le démarrage d'un événement")
        .addStringOption((option) =>
          option
            .setName("evenement")
            .setDescription("L'événement à démarrer")
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addStringOption((option) =>
          option
            .setName("date")
            .setDescription("La date de démarrage (ex: 25/12/2026 18:00)")
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("aléatoire")
        .setDescription("Sélectionne aléatoirement des événements")
        .addIntegerOption((option) =>
          option
            .setName("nb_evenement")
            .setDescription("Le nombre d'événements à sélectionner")
            .setRequired(true)
            .setMinValue(1),
        )
        .addStringOption((option) =>
          option
            .setName("date")
            .setDescription("La date de démarrage (ex: 25/12/2026 18:00)")
            .setRequired(false),
        ),
    ),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },

  async proxy(client, interaction, config) {
    const { serveur, evenement, nb_evenement, date } = interaction.parametre;
    const sousCommande = interaction.subcommand;

    if (sousCommande === "gérer") {
      const { servers } = await discordStaff(
        interaction.user.id,
        serveur,
        "super_moderateur",
      );

      if (servers.length === 0) {
        const errorContainer = buildErrorContainer(
          config,
          "## ❌ Permission Manquante",
          "Tu n'as pas la permission de gérer les événements de ce serveur.",
        );

        return sendTemporaryError(interaction, errorContainer);
      }

      const page = 0;

      const tousLesEvenements = await Evenement.find({ serveur }).lean();
      const totalPages = Math.max(
        1,
        Math.ceil(tousLesEvenements.length / EVENEMENTS_PAR_PAGE),
      );
      const pageActuelle = Math.min(Math.max(page, 0), totalPages - 1);

      const evenementsPage = tousLesEvenements.slice(
        pageActuelle * EVENEMENTS_PAR_PAGE,
        pageActuelle * EVENEMENTS_PAR_PAGE + EVENEMENTS_PAR_PAGE,
      );

      const container = new ContainerBuilder()
        .setAccentColor(config.serveur[serveur].couleur)
        .addSectionComponents((section) =>
          section
            .addTextDisplayComponents((t) =>
              t.setContent("## 🎉 Gestion des Événements"),
            )
            .setButtonAccessory((button) =>
              button
                .setCustomId(`evenement_creer-${serveur}`)
                .setLabel("➕ Créer un Événement")
                .setStyle(ButtonStyle.Success),
            ),
        )
        .addSeparatorComponents((s) => s);

      if (evenementsPage.length === 0) {
        container
          .addTextDisplayComponents((t) =>
            t.setContent("Aucun événement n'a été créé sur ce serveur."),
          )
          .addSeparatorComponents((s) => s);
      }

      for (const evenementData of evenementsPage) {
        container
          .addSectionComponents((section) =>
            section
              .addTextDisplayComponents((t) =>
                t.setContent(
                  `**${evenementData.emoji ?? "🎉"} ${evenementData.nom}**`,
                ),
              )
              .setButtonAccessory((button) =>
                button
                  .setCustomId(`evenement_modifier-${evenementData._id}`)
                  .setLabel("✏️ Modifier l'Événement")
                  .setStyle(ButtonStyle.Primary),
              ),
          )
          .addSeparatorComponents((s) => s);
      }

      container.addActionRowComponents((row) =>
        row.setComponents(
          new ButtonBuilder()
            .setCustomId(`evenement_page-${pageActuelle - 1}`)
            .setLabel("◀️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(pageActuelle === 0),
          new ButtonBuilder()
            .setCustomId("evenement_page_label")
            .setLabel(`Page ${pageActuelle + 1}/${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`evenement_page-${pageActuelle + 1}`)
            .setLabel("▶️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(pageActuelle >= totalPages - 1),
        ),
      );

      replyOrUpdate(interaction, [container]);
    }

    if (sousCommande === "lancer") {
      const timestamp = parseDateDiscord(date);

      if (date && !timestamp) {
        const errorContainer = buildErrorContainer(
          config,
          "❌ Format Invalide",
          "Utilise : `JJ/MM/AAAA HHhMM` ou `JJ/MM/AAAA HH:MM`\nExemple : `19/06/2026 20h30`",
        );

        return sendTemporaryError(interaction, errorContainer);
      }

      const evenementData = await Evenement.findOne({
        serveur,
        nom: evenement,
      }).lean();

      if (!evenementData) {
        const errorContainer = buildErrorContainer(
          config,
          "❌ Événement Introuvable",
          `L'événement "**${evenement}**" n'existe pas sur le serveur ${config.serveur[serveur].emoji_formate} **${config.serveur[serveur].nom}**.`,
        );

        return sendTemporaryError(interaction, errorContainer);
      }

      const configEvenement = await Configuration.findOne({
        serveur,
        guildId: interaction.guild.id,
        categorie: "Événement",
        systeme: "Événement",
      });

      const fileName = evenementData.image?.data
        ? `evenementData.${evenementData.image.extension || "png"}`
        : null;

      const files = [];
      if (evenementData.image?.data) {
        files.push(
          new AttachmentBuilder(
            Buffer.from(evenementData.image.data, "base64"),
            {
              name: fileName,
            },
          ),
        );
      }

      const teteEmojis = new Map(
        evenementData.createur.map((pseudo) => [
          pseudo,
          getCachedEmojiTete(pseudo, "🧑"),
        ]),
      );

      const components = buildEvenementLancerComponents({
        evenementData,
        configEvenement,
        config,
        serveur,
        date,
        timestamp,
        fileName,
        teteEmojis,
      });

      const channel = await client.channels.fetch(interaction.channelId);
      const message = await channel.send({
        components,
        files,
        flags: MessageFlags.IsComponentsV2,
      });

      const userContainer = new ContainerBuilder()
        .setAccentColor(config.serveur[serveur].couleur)
        .addTextDisplayComponents((t) => t.setContent("## 🎉 Événement"))
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent("Le message d'événement a bien été envoyé"),
        );

      sendTemporaryError(interaction, userContainer);

      if (evenementData.createur.length > 0) {
        void (async () => {
          const resolvedEntries = await Promise.all(
            evenementData.createur.map(async (pseudo) => [
              pseudo,
              (await getEmojiTete(client, pseudo)) || "🧑",
            ]),
          );

          const updatedComponents = buildEvenementLancerComponents({
            evenementData,
            configEvenement,
            config,
            serveur,
            date,
            timestamp,
            fileName,
            teteEmojis: new Map(resolvedEntries),
          });

          await channel.messages.edit(message.id, {
            components: updatedComponents,
            flags: MessageFlags.IsComponentsV2,
          });
        })();
      }
    }

    if (sousCommande === "aléatoire") {
      const timestamp = parseDateDiscord(date);

      if (date && !timestamp) {
        const errorContainer = buildErrorContainer(
          config,
          "❌ Format Invalide",
          "Utilise : `JJ/MM/AAAA HHhMM` ou `JJ/MM/AAAA HH:MM`\nExemple : `19/06/2026 20h30`",
        );

        return sendTemporaryError(interaction, errorContainer);
      }

      const tousLesEvenements = await Evenement.find({ serveur }).lean();

      if (tousLesEvenements.length === 0) {
        const errorContainer = buildErrorContainer(
          config,
          "## ❌ Manque d'Événements",
          "Aucun événement n'a été créé sur ce serveur.",
        );

        sendTemporaryError(interaction, errorContainer);
      }

      if (nb_evenement > tousLesEvenements.length) {
        const errorContainer = buildErrorContainer(
          config,
          "## ❌ Manque d'Événements",
          `Il n'y a que **${tousLesEvenements.length}** événement${tousLesEvenements.length > 1 ? "s" : ""} disponible${tousLesEvenements.length > 1 ? "s" : ""} sur ce serveur.`,
        );

        return sendTemporaryError(interaction, errorContainer);
      }

      const configEvenement = await Configuration.findOne({
        serveur,
        guildId: interaction.guild.id,
        categorie: "Événement",
        systeme: "Événement",
      });

      for (let i = tousLesEvenements.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tousLesEvenements[i], tousLesEvenements[j]] = [
          tousLesEvenements[j],
          tousLesEvenements[i],
        ];
      }

      const evenementsSelectionnes = tousLesEvenements.slice(0, nb_evenement);

      const uniqueCreateurs = [
        ...new Set(evenementsSelectionnes.flatMap((e) => e.createur || [])),
      ];

      const teteEmojis = new Map(
        uniqueCreateurs.map((pseudo) => [
          pseudo,
          getCachedEmojiTete(pseudo, "🧑"),
        ]),
      );

      const components = buildEvenementAleatoireComponents({
        evenementsSelectionnes,
        configEvenement,
        config,
        serveur,
        nb_evenement,
        timestamp,
        date,
        teteEmojis,
      });

      const channel = await client.channels.fetch(interaction.channelId);
      const message = await channel.send({
        components,
        flags: MessageFlags.IsComponentsV2,
      });

      const userContainer = new ContainerBuilder()
        .setAccentColor(config.serveur[serveur].couleur)
        .addTextDisplayComponents((t) => t.setContent("## 🎉 Événement"))
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent("Le message d'événement a bien été envoyé"),
        );

      sendTemporaryError(interaction, userContainer);

      if (uniqueCreateurs.length > 0) {
        void (async () => {
          const resolvedEntries = await Promise.all(
            uniqueCreateurs.map(async (pseudo) => [
              pseudo,
              (await getEmojiTete(client, pseudo)) || "🧑",
            ]),
          );

          const updatedComponents = buildEvenementAleatoireComponents({
            evenementsSelectionnes,
            configEvenement,
            config,
            serveur,
            nb_evenement,
            timestamp,
            date,
            teteEmojis: new Map(resolvedEntries),
          });

          await channel.messages.edit(message.id, {
            components: updatedComponents,
            flags: MessageFlags.IsComponentsV2,
          });
        })();
      }
    }
  },
};
