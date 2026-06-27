const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
} = require("discord.js");
const { getData } = require("../../../../util/module/getAndSaveData");
const { getServeur } = require("../../../../util/module/getServeur");
const { getEmojiTete } = require("../../../../util/module/emoji");
const Configuration = require("../../../../util/database/models/Configuration");
const Serveur = require("../../../../util/database/models/Serveur");

module.exports = {
  data: {
    name: "notation_module",
  },

  async execute(client, interaction, config) {
    const subId = interaction.customId;
    const serveur = await getServeur(interaction);

    if (subId === "notation_module") {
      const container = new ContainerBuilder()
        .setAccentColor(
          config.serveur[serveur].couleur || config.colors.success,
        )
        .addTextDisplayComponents((t) =>
          t.setContent(`## 🎲 Configuration - Notation (${serveur})`),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            "Choisis la méthode de répartition des notations :\n\n" +
              "🔹 **Mélanger aléatoirement** pour répartir automatiquement\n" +
              "🔹 **Définir manuellement** pour choisir toi-même qui note quelle plage",
          ),
        )
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("notation_module-automatique")
              .setLabel("Mélanger aléatoirement")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId("notation_module-manual")
              .setLabel("Définir manuellement")
              .setStyle(ButtonStyle.Secondary),
          ),
        );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (subId === "notation_module-automatique") {
      return await modeAutomatique(client, interaction, config, serveur);
    }

    if (subId.startsWith("notation_module-manual")) {
      return await modeManuel(client, interaction, config, serveur, subId);
    }
  },
};

async function modeAutomatique(client, interaction, config, serveur) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const staffServeur = await Serveur.findOne({
    serveur,
  }).lean();

  const staffList = [
    ...(staffServeur.staff.administrateur || []),
    ...(staffServeur.staff.super_moderateur || []),
  ];

  staffList.sort(() => Math.random() - 0.5);

  const configRepartition =
    (await Configuration.findOne({
      serveur,
      categorie: "Notations",
      systeme: "Répartition",
      guildId: interaction.guild.id,
    })) ||
    new Configuration({
      serveur,
      categorie: "Notations",
      systeme: "Répartition",
      guildId: interaction.guild.id,
      active: false,
      data: {},
    });

  let numbers = [];

  if (config.liste_serveur_bedrock.includes(serveur)) {
    numbers = Array.from({ length: 238 }, (_, i) => i + 1);
    const excluded = new Set([
      1,
      187,
      ...Array.from({ length: 17 }, (_, i) => 203 + i),
    ]);

    numbers = numbers.filter((n) => !excluded.has(n));
  } else {
    numbers = Array.from({ length: 267 }, (_, i) => i + 1);
  }

  const totalNumbers = numbers.length;
  const base = Math.floor(totalNumbers / staffList.length);
  const remainder = totalNumbers % staffList.length;

  const repartition = {};
  let indexPointer = 0;

  staffList.forEach((staff, index) => {
    const size = base + (index < remainder ? 1 : 0);
    const slice = numbers.slice(indexPointer, indexPointer + size);

    repartition[staff] = `${slice[0]} à ${slice[slice.length - 1]}`;
    indexPointer += size;
  });

  configRepartition.data.set("donnee", repartition);
  await configRepartition.save();

  const embedDescription = await Promise.all(
    Object.entries(repartition).map(async ([staff, range]) => {
      const emoji =
        (await getEmojiTete(client, staff)) ||
        "<:tete_default:1517896405841215619>";
      return `${emoji} **${staff.replace(/_/g, "\\_")}** : ${range}`;
    }),
  );

  const container = new ContainerBuilder()
    .setAccentColor(config.colors.success)
    .addTextDisplayComponents((t) =>
      t.setContent("## 🎲 Répartition Automatique"),
    )
    .addSeparatorComponents((separator) => separator)
    .addTextDisplayComponents((t) => t.setContent(embedDescription.join("\n")));

  await interaction.editReply({
    components: [container],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  });
}

const manualCache = new Map();

async function modeManuel(client, interaction, config, serveur, subId) {
  const staffServeur = await Serveur.findOne({
    serveur,
  }).lean();

  const staffList = [
    ...(staffServeur.staff.administrateur || []),
    ...(staffServeur.staff.super_moderateur || []),
  ];

  if (!manualCache.has(serveur)) manualCache.set(serveur, new Map());
  const cache = manualCache.get(serveur);

  if (subId === "notation_module-manual") {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const maxButtons = staffList.length;
    const choiceButtons = Array.from({ length: maxButtons }, (_, i) =>
      new ButtonBuilder()
        .setCustomId(`notation_module-manual-choose-${i + 1}`)
        .setLabel(`${i + 1} personnes`)
        .setStyle(ButtonStyle.Primary),
    );

    const actionRows = [];
    for (let i = 0; i < choiceButtons.length; i += 5) {
      const row = new ActionRowBuilder().addComponents(
        choiceButtons.slice(i, i + 5),
      );
      actionRows.push(row);
    }

    const container = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur || config.colors.success)
      .addTextDisplayComponents((t) =>
        t.setContent("## 🧮 Répartition manuelle"),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((t) =>
        t.setContent("En combien de personnes veux-tu partager la notation ?"),
      )
      .addSeparatorComponents((separator) => separator)
      .addActionRowComponents(...actionRows);

    return interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  }

  if (subId.startsWith("notation_module-manual-choose-")) {
    await interaction.deferUpdate();
    const number = parseInt(subId.split("-").pop());

    let numbers = [];

    if (config.liste_serveur_bedrock.includes(serveur)) {
      numbers = Array.from({ length: 238 }, (_, i) => i + 1);

      const excluded = new Set([
        1,
        187,
        ...Array.from({ length: 17 }, (_, i) => 203 + i), // 203 → 219
      ]);

      numbers = numbers.filter((n) => !excluded.has(n));
    } else {
      numbers = Array.from({ length: 267 }, (_, i) => i + 1);
    }

    const totalNumbers = numbers.length;

    const base = Math.floor(totalNumbers / number);
    const remainder = totalNumbers % number;

    const ranges = [];
    let index = 0;

    for (let i = 0; i < number; i++) {
      const size = base + (i < remainder ? 1 : 0);
      const slice = numbers.slice(index, index + size);

      ranges.push([slice[0], slice[slice.length - 1]]);
      index += size;
    }

    const [start, end] = ranges[0];

    const batchId = `m${Date.now()}${Math.floor(Math.random() * 1000)}`;
    manualCache.set(batchId, { ranges, number });

    const staffButtons = await Promise.all(
      staffList.map(async (s) => {
        const emoji = await getEmojiTete(client, s);
        const isChosen = cache.has(s);
        const button = new ButtonBuilder()
          .setCustomId(`notation_module-manual-assign-${batchId}-0-${s}`)
          .setLabel(s)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(isChosen);

        if (emoji)
          button.setEmoji({
            id: emoji.id,
            name: emoji.name,
            animated: emoji.animated,
          });
        return button;
      }),
    );

    const actionRows = [];
    for (let i = 0; i < staffButtons.length; i += 5) {
      actionRows.push(
        new ActionRowBuilder().addComponents(staffButtons.slice(i, i + 5)),
      );
    }

    const container = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur || config.colors.success)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## <:tete_default:1517896405841215619>‍⚖️ Qui note de **${start} à ${end}** ?`,
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addActionRowComponents(...actionRows);

    return interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  }

  if (subId.startsWith("notation_module-manual-assign-")) {
    await interaction.deferUpdate();

    const [, , , batchId, indexStr, ...staffParts] = subId.split("-");
    const index = parseInt(indexStr);
    const staff = staffParts.join("-");

    const batch = manualCache.get(batchId);
    if (!batch)
      return interaction.reply({
        content: "❌ Session expirée ou invalide.",
        ephemeral: true,
      });

    const { ranges, number } = batch;
    const [start, end] = ranges[index];
    cache.set(staff, `${start} à ${end}`);

    const nextIndex = index + 1;
    if (nextIndex >= number) {
      const configRepartition =
        (await Configuration.findOne({
          serveur,
          categorie: "Notations",
          systeme: "Répartition",
          guildId: interaction.guild.id,
        })) ||
        new Configuration({
          serveur,
          categorie: "Notations",
          systeme: "Répartition",
          guildId: interaction.guild.id,
          active: false,
          data: {},
        });

      configRepartition.data.set("donnee", Object.fromEntries(cache.entries()));
      await configRepartition.save();
      manualCache.delete(batchId);
      manualCache.delete(serveur);

      const repartitionText = (
        await Promise.all(
          Array.from(cache.entries()).map(async ([s, range]) => {
            const emoji =
              (await getEmojiTete(client, s)) ||
              "<:tete_default:1517896405841215619>";
            return `${emoji} **${s.replace(/_/g, "\\_")}** : ${range}`;
          }),
        )
      ).join("\n");

      const doneContainer = new ContainerBuilder()
        .setAccentColor(config.colors.success)
        .addTextDisplayComponents((t) =>
          t.setContent("## 🤚 Répartition Manuelle"),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((t) => t.setContent(repartitionText));

      return interaction.editReply({
        components: [doneContainer],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const [nextStart, nextEnd] = ranges[nextIndex];

    const staffButtons = await Promise.all(
      staffList.map(async (s) => {
        const emoji = await getEmojiTete(client, s);
        const isChosen = cache.has(s);
        const button = new ButtonBuilder()
          .setCustomId(
            `notation_module-manual-assign-${batchId}-${nextIndex}-${s}`,
          )
          .setLabel(s)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(isChosen);

        if (emoji)
          button.setEmoji({
            id: emoji.id,
            name: emoji.name,
            animated: emoji.animated,
          });
        return button;
      }),
    );

    const actionRows = [];
    for (let i = 0; i < staffButtons.length; i += 5) {
      actionRows.push(
        new ActionRowBuilder().addComponents(staffButtons.slice(i, i + 5)),
      );
    }

    const nextContainer = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur || config.colors.success)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## <:tete_default:1517896405841215619>‍⚖️ Qui note de **${nextStart} à ${nextEnd}** ?`,
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addActionRowComponents(...actionRows);

    return interaction.editReply({
      components: [nextContainer],
      flags: MessageFlags.IsComponentsV2,
    });
  }
}
