const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
} = require("discord.js");
const { getData, saveData } = require("../../../util/module/getAndSaveData");
const { getServeur } = require("../../../util/module/getServeur");
const { getEmojiTete } = require("../../../util/module/emoji");

module.exports = {
  data: {
    name: "notation_module",
  },

  async execute(client, interaction, config) {
    const subId = interaction.customId;
    const serveur = await getServeur(interaction);

    if (subId === "notation_module") {
      const container = new ContainerBuilder()
        .setAccentColor(config.couleur[serveur] || config.colors.success)
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
  await interaction.deferReply({ ephemeral: true });

  const staffData = await getData(`data/${serveur}/staff-serveur.json`);
  const staffList = [
    ...(staffData["Administrateur"] || []),
    ...(staffData["Super-Modérateur"] || []),
  ];

  staffList.sort(() => Math.random() - 0.5);

  const configNotationPath = `data/${serveur}/config-notation.json`;
  const configNotation = (await getData(configNotationPath)) || {};

  const totalNumbers = ["alpha", "sigma", "omega", "delta", "epsilon"].includes(
    serveur,
  )
    ? 219
    : 267;
  const base = Math.floor(totalNumbers / staffList.length);
  const remainder = totalNumbers % staffList.length;

  let current = 1;
  const repartition = {};
  staffList.forEach((staff, index) => {
    const size = base + (index < remainder ? 1 : 0);
    repartition[staff] = `${current} à ${current + size - 1}`;
    current += size;
  });

  configNotation["répartition"].donnee = repartition;
  saveData(configNotationPath, configNotation);

  const embedDescription = await Promise.all(
    Object.entries(repartition).map(async ([staff, range]) => {
      const emoji = await getEmojiTete(client, staff);
      return `${emoji} **${staff}** : ${range}`;
    }),
  );

  const container = new ContainerBuilder()
    .setAccentColor(config.colors.success)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `## 🎲 Répartition Automatique - ${
          serveur.charAt(0).toUpperCase() + serveur.slice(1)
        }`,
      ),
    )
    .addTextDisplayComponents((t) => t.setContent(embedDescription.join("\n")));

  await interaction.editReply({
    components: [container],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  });
}

const manualCache = new Map();

async function modeManuel(client, interaction, config, serveur, subId) {
  const staffData = await getData(`data/${serveur}/staff-serveur.json`);
  const staffList = [
    ...(staffData["Administrateur"] || []),
    ...(staffData["Super-Modérateur"] || []),
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
      .setAccentColor(config.couleur[serveur] || config.colors.success)
      .addTextDisplayComponents((t) =>
        t.setContent("## 🧮 Répartition manuelle"),
      )
      .addTextDisplayComponents((t) =>
        t.setContent("En combien de personnes veux-tu partager la notation ?"),
      )
      .addActionRowComponents(...actionRows);

    return interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  }

  if (subId.startsWith("notation_module-manual-choose-")) {
    await interaction.deferUpdate();
    const number = parseInt(subId.split("-").pop());

    const totalNumbers = [
      "alpha",
      "sigma",
      "omega",
      "delta",
      "epsilon",
    ].includes(serveur)
      ? 219
      : 267;
    const base = Math.floor(totalNumbers / number);
    const remainder = totalNumbers % number;

    let current = 1;
    const ranges = [];
    for (let i = 0; i < number; i++) {
      const size = base + (i < remainder ? 1 : 0);
      ranges.push([current, current + size - 1]);
      current += size;
    }

    const [start, end] = ranges[0];

    const staffButtons = await Promise.all(
      staffList.map(async (s) => {
        const emoji = await getEmojiTete(client, s);
        const isChosen = cache.has(s);
        return new ButtonBuilder()
          .setCustomId(
            `notation_module-manual-assign-${number}-${start - 1}-${ranges
              .map((r) => r.join(","))
              .join(";")}-${s}`,
          )
          .setLabel(s)
          .setEmoji({
            id: emoji.id,
            name: emoji.name,
            animated: emoji.animated,
          })
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(isChosen);
      }),
    );

    const actionRows = [];
    let startIndex = 0;
    let remaining = staffButtons.length;

    while (startIndex < staffButtons.length) {
      const remainingRows = Math.ceil(remaining / 5);
      const buttonsThisRow = Math.ceil(remaining / remainingRows);
      actionRows.push(
        new ActionRowBuilder().addComponents(
          staffButtons.slice(startIndex, startIndex + buttonsThisRow),
        ),
      );
      startIndex += buttonsThisRow;
      remaining -= buttonsThisRow;
    }

    const container = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur] || config.colors.success)
      .addTextDisplayComponents((t) =>
        t.setContent(`## 🧑‍⚖️ Qui note de **${start} à ${end}** ?`),
      )
      .addActionRowComponents(...actionRows);

    return interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  }

  if (subId.startsWith("notation_module-manual-assign-")) {
    await interaction.deferUpdate();

    const parts = subId.split("-");
    const total = parseInt(parts[3]);
    const index = parseInt(parts[4]);
    const rawRanges = parts[5];
    const staff = parts.slice(6).join("-");

    const ranges = rawRanges.split(";").map((r) => r.split(",").map(Number));
    const [start, end] = ranges[index];

    cache.set(staff, `${start} à ${end}`);

    const nextIndex = index + 1;
    if (nextIndex >= total) {
      const configNotationPath = `data/${serveur}/config-notation.json`;
      const configNotation = (await getData(configNotationPath)) || {};
      for (const key of Object.keys(configNotation["répartition"].donnee)) {
        delete configNotation["répartition"].donnee[key];
      }

      for (const [s, range] of cache.entries()) {
        configNotation["répartition"].donnee[s] = range;
      }
      saveData(configNotationPath, configNotation);
      manualCache.delete(serveur);

      const repartitionText = (
        await Promise.all(
          Array.from(cache.entries()).map(async ([s, range]) => {
            const emoji = await getEmojiTete(client, s);
            const emojiText = emoji.id
              ? `<:${emoji.name}:${emoji.id}>`
              : emoji.name;
            return `${emojiText} **${s}** : ${range}`;
          }),
        )
      ).join("\n");

      const doneContainer = new ContainerBuilder()
        .setAccentColor(config.colors.success)
        .addTextDisplayComponents((t) =>
          t.setContent("## ✅ Répartition manuelle terminée et enregistrée !"),
        )
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
        return new ButtonBuilder()
          .setCustomId(
            `notation_module-manual-assign-${total}-${nextIndex}-${ranges
              .map((r) => r.join(","))
              .join(";")}-${s}`,
          )
          .setLabel(s)
          .setEmoji({
            id: emoji.id,
            name: emoji.name,
            animated: emoji.animated,
          })
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(isChosen);
      }),
    );

    const actionRows = [];
    let startIndex = 0;
    let remaining = staffButtons.length;

    while (startIndex < staffButtons.length) {
      const remainingRows = Math.ceil(remaining / 5);
      const buttonsThisRow = Math.ceil(remaining / remainingRows);
      actionRows.push(
        new ActionRowBuilder().addComponents(
          staffButtons.slice(startIndex, startIndex + buttonsThisRow),
        ),
      );
      startIndex += buttonsThisRow;
      remaining -= buttonsThisRow;
    }

    const nextContainer = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur] || config.colors.success)
      .addTextDisplayComponents((t) =>
        t.setContent(`## 🧑‍⚖️ Qui note de **${nextStart} à ${nextEnd}** ?`),
      )
      .addActionRowComponents(...actionRows);

    return interaction.editReply({
      components: [nextContainer],
      flags: MessageFlags.IsComponentsV2,
    });
  }
}
