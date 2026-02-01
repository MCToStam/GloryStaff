const fs = require("fs");
const path = require("path");
const Canvas = require("canvas");
const {
  ContainerBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionType,
  MessageFlags,
  RoleSelectMenuBuilder,
  AttachmentBuilder,
} = require("discord.js");
const config = require("../config");

const cachePath = path.join(__dirname, "..", "data", "emojisCache.json");
let emojisCache = fs.existsSync(cachePath)
  ? JSON.parse(fs.readFileSync(cachePath, "utf8"))
  : {};

async function getGradeEmoji(serveur, guild, idCat, grade) {
  const now = Date.now();
  const key = `${serveur}_${idCat}_${grade.id}`;
  const colorKey = grade.couleur.toLowerCase();

  const existingColorEmoji = Object.values(emojisCache).find(
    (e) => e.color === colorKey,
  );
  if (existingColorEmoji) {
    const emoji = guild.emojis.cache.get(existingColorEmoji.emojiId);
    if (emoji) {
      emojisCache[key] = {
        emojiId: emoji.id,
        color: colorKey,
        createdAt: now,
      };
      fs.writeFileSync(cachePath, JSON.stringify(emojisCache, null, 2));
      return emoji;
    }
  }

  if (emojisCache[key]) {
    const { emojiId } = emojisCache[key];
    try {
      await guild.emojis.delete(emojiId);
    } catch (e) {
      console.warn(`Impossible de supprimer l'emoji ${emojiId}:`, e.message);
    }
  }

  const canvas = Canvas.createCanvas(32, 32);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = grade.couleur;
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();

  const safeKey = key.toLowerCase().replace(/[^a-z0-9_]/g, "_");

  const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), {
    name: `${safeKey}.png`,
  });
  const emoji = await guild.emojis.create({
    attachment: attachment.attachment,
    name: `${serveur}_${idCat}_${grade.id}`.slice(0, 32),
  });

  emojisCache[key] = {
    emojiId: emoji.id,
    color: colorKey,
    createdAt: now,
  };
  fs.writeFileSync(cachePath, JSON.stringify(emojisCache, null, 2));

  setTimeout(
    async () => {
      try {
        const stillHere = guild.emojis.cache.get(emoji.id);
        if (stillHere) await stillHere.delete();
        delete emojisCache[key];
        fs.writeFileSync(cachePath, JSON.stringify(emojisCache, null, 2));
      } catch (e) {
        console.warn(`Erreur suppression emoji ${emoji.id}:`, e.message);
      }
    },
    60 * 60 * 1000,
  );

  return emoji;
}

function formatHexColor(input) {
  let color = input.toUpperCase();
  if (!color.startsWith("#")) color = "#" + color;
  if (!/^#[0-9A-F]{6}$/.test(color)) return null;
  return color;
}

async function generateContainer(serveur) {
  const filePath = path.join(__dirname, "..", "data", serveur, "grade.json");
  let roleData = {};
  try {
    roleData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    roleData = {};
  }

  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((td) =>
      td.setContent("## Gestion des Catégories"),
    )
    .addSeparatorComponents((sep) => sep);

  const categories = roleData.categorie || [];

  if (categories.length > 0) {
    categories.forEach((cat) => {
      container
        .addTextDisplayComponents((td) => td.setContent(`\n- **${cat.nom}**`))
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`grade_categorie_edit-${cat.id}`)
              .setLabel("Modifier")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`grade_categorie_delete-${cat.id}`)
              .setLabel("Supprimer")
              .setStyle(ButtonStyle.Danger),
          ),
        );
    });
  } else {
    container.addTextDisplayComponents((td) =>
      td.setContent("Aucune catégorie n'a été créée"),
    );
  }

  const options = categories.map((cat) => ({
    label: cat.nom,
    value: cat.id,
  }));

  container.addSeparatorComponents((separator) => separator);

  if (categories.length > 0) {
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("grade_categorie_manage")
          .setPlaceholder("Gérer une catégorie")
          .addOptions(options),
      ),
    );
  }
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("grade_categorie_create")
        .setLabel("Créer une catégorie")
        .setStyle(ButtonStyle.Success),
    ),
  );

  return container;
}

async function generateGradesContainer(client, serveur, idCat) {
  const filePath = path.join(__dirname, "..", "data", serveur, "grade.json");
  let roleData = {};
  try {
    roleData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    roleData = {};
  }

  const grades = (roleData.grade || []).filter((g) => g.categorie === idCat);
  const categorie = roleData.categorie.find((c) => c.id === idCat);

  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((td) =>
      td.setContent(
        `## Gestion des Grades - ${categorie ? categorie.nom : idCat}`,
      ),
    )
    .addSeparatorComponents((sep) => sep);

  const guild = client
    ? await client.guilds.fetch("1349379748576366633")
    : null;

  if (grades.length > 0) {
    for (const g of grades) {
      const emoji = guild
        ? await getGradeEmoji(serveur, guild, idCat, g)
        : null;

      container
        .addTextDisplayComponents((td) =>
          td.setContent(`- ${emoji ? emoji : ""} **${g.nom}** (${g.couleur})`),
        )
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`grade_edit-${idCat}-${g.id}`)
              .setLabel("Modifier")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`grade_delete-${idCat}-${g.id}`)
              .setLabel("Supprimer")
              .setStyle(ButtonStyle.Danger),
          ),
        );
    }
  } else {
    container.addTextDisplayComponents((td) =>
      td.setContent("Aucun grade n'a été créé dans cette catégorie"),
    );
  }

  container
    .addSeparatorComponents((sep) => sep)
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("categorie_grade_back")
          .setLabel("Retour aux catégories")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`grade_create-${idCat}`)
          .setLabel("Créer un grade")
          .setStyle(ButtonStyle.Success),
      ),
    );

  return { container };
}

async function handleInteraction(interaction, client, config) {
  try {
    const color = interaction.message?.components?.[0]?.data?.accent_color;
    const serveur = Object.keys(config.couleur).find((key) => {
      const hexValue = config.couleur[key];
      const decimalValue =
        typeof hexValue === "string" ? parseInt(hexValue, 16) : hexValue;
      return decimalValue === color;
    });
    if (!serveur) return;

    const filePath = path.join(__dirname, "..", "data", serveur, "grade.json");
    let roleData = {};
    try {
      roleData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {
      roleData = {};
    }

    if (interaction.isButton() || interaction.isAnySelectMenu()) {
      const id = interaction.customId;

      if (id === "categorie_grade_back") {
        const container = await generateContainer(serveur);
        return interaction.update({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      if (id === "grade_categorie_create") {
        const modal = new ModalBuilder()
          .setCustomId("modal_create_categorie")
          .setTitle("Créer une catégorie")
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("categorie_name")
                .setLabel("Nom de la catégorie")
                .setStyle(TextInputStyle.Short)
                .setRequired(true),
            ),
          );
        return interaction.showModal(modal);
      }

      if (id.startsWith("grade_categorie_delete-")) {
        const idCat = id.replace("grade_categorie_delete_", "");
        roleData.categorie =
          roleData.categorie?.filter((c) => c.id !== idCat) || [];
        roleData.grade =
          roleData.grade?.filter((g) => g.categorie !== idCat) || [];
        fs.writeFileSync(filePath, JSON.stringify(roleData, null, 2), "utf-8");

        const container = await generateContainer(serveur);
        return interaction.update({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      if (id.startsWith("grade_categorie_edit-")) {
        const idCat = id.replace("grade_categorie_edit-", "");
        const categorie = roleData.categorie.find((c) => c.id === idCat);

        const container = new ContainerBuilder()
          .setAccentColor(config.couleur[serveur])
          .addTextDisplayComponents((td) =>
            td.setContent(`## Édition de la catégorie`),
          )
          .addSeparatorComponents((sep) => sep)
          .addTextDisplayComponents((td) =>
            td.setContent(`**Nom de la catégorie :** ${categorie.nom}`),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_categorie_rename-${idCat}`)
                .setLabel("Modifier le nom")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**${
                categorie.role && categorie.role.length > 1
                  ? "Rôles mentionnés"
                  : "Rôle mentionné"
              } lors d'un rank ou dérank :**`,
            ),
          )
          .addActionRowComponents((actionRow) =>
            actionRow.setComponents(
              new RoleSelectMenuBuilder()
                .setDisabled(false)
                .setCustomId(`grade_categorie_role-${idCat}`)
                .setPlaceholder(
                  categorie.role && categorie.role.length > 0
                    ? "Choisit un ou plusieurs rôles"
                    : "Aucun rôle",
                )
                .setDefaultRoles(categorie.role)
                .setMinValues(0)
                .setMaxValues(25),
            ),
          )
          .addSeparatorComponents((sep) => sep)
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("categorie_grade_back")
                .setLabel("Retour aux catégories")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`grade_categorie_delete-${idCat}`)
                .setLabel("Supprimer la catégorie")
                .setStyle(ButtonStyle.Danger),
            ),
          );

        return interaction.update({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      if (id.startsWith("grade_categorie_role-")) {
        const idCat = id.replace("grade_categorie_role-", "");
        const roleIds = [...interaction.roles.keys()];
        const categorie = roleData.categorie.find((c) => c.id === idCat);
        categorie.role = roleIds;

        fs.writeFileSync(filePath, JSON.stringify(roleData, null, 2), "utf-8");

        const container = new ContainerBuilder()
          .setAccentColor(config.couleur[serveur])
          .addTextDisplayComponents((td) =>
            td.setContent(`## Édition de la catégorie`),
          )
          .addSeparatorComponents((sep) => sep)
          .addTextDisplayComponents((td) =>
            td.setContent(`**Nom de la catégorie :** ${categorie.nom}`),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_categorie_rename-${idCat}`)
                .setLabel("Modifier le nom")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**${
                categorie.role && categorie.role.length > 1
                  ? "Rôles mentionnés"
                  : "Rôle mentionné"
              } lors d'un rank ou dérank :**`,
            ),
          )
          .addActionRowComponents((actionRow) =>
            actionRow.setComponents(
              new RoleSelectMenuBuilder()
                .setDisabled(false)
                .setCustomId(`grade_categorie_role-${idCat}`)
                .setPlaceholder(
                  categorie.role && categorie.role.length > 0
                    ? "Choisit un ou plusieurs rôles"
                    : "Aucun rôle",
                )
                .setDefaultRoles(categorie.role)
                .setMinValues(0)
                .setMaxValues(25),
            ),
          )
          .addSeparatorComponents((sep) => sep)
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("categorie_grade_back")
                .setLabel("Retour aux catégories")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`grade_categorie_delete-${idCat}`)
                .setLabel("Supprimer la catégorie")
                .setStyle(ButtonStyle.Danger),
            ),
          );
        return interaction.update({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      if (id.startsWith("grade_categorie_rename-")) {
        const idCat = id.replace("grade_categorie_rename-", "");
        const categorie = roleData.categorie.find((c) => c.id === idCat);
        const modal = new ModalBuilder()
          .setCustomId(`modal_edit_categorie-${idCat}`)
          .setTitle(`Modifier ${categorie.nom}`)
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("categorie_name")
                .setLabel("Nouveau nom")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setValue(categorie.nom),
            ),
          );
        return interaction.showModal(modal);
      }

      if (id === "grade_categorie_manage") {
        const idCat = interaction.values[0];
        await interaction.deferUpdate({ flags: MessageFlags.Ephemeral });
        const { container } = await generateGradesContainer(
          interaction.client,
          serveur,
          idCat,
        );
        await interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      if (id.startsWith("grade_create-")) {
        const idCat = id.replace("grade_create-", "");
        const categorie = roleData.categorie.find((c) => c.id === idCat);
        const modal = new ModalBuilder()
          .setCustomId(`modal_create_grade-${idCat}`)
          .setTitle(`Créer un grade dans ${categorie.nom}`)
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("grade_nom")
                .setLabel("Nom du grade")
                .setStyle(TextInputStyle.Short)
                .setRequired(true),
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("grade_couleur")
                .setLabel("Couleur HEX")
                .setStyle(TextInputStyle.Short)
                .setRequired(true),
            ),
          );
        return interaction.showModal(modal);
      }

      if (id.startsWith("grade_edit-")) {
        const [_, idCat, idGrade] = id.split("-");
        const grade = roleData.grade.find(
          (g) => g.id === idGrade && g.categorie === idCat,
        );
        if (!grade) return;

        const guild = await interaction.client.guilds.fetch(
          "1349379748576366633",
        );

        const emoji = await getGradeEmoji(serveur, guild, idCat, grade);

        const container = new ContainerBuilder()
          .setAccentColor(config.couleur[serveur])
          .addTextDisplayComponents((td) =>
            td.setContent(`## Édition du Grade`),
          )
          .addSeparatorComponents((sep) => sep)
          .addTextDisplayComponents((td) =>
            td.setContent(`**Nom du grade :** ${grade.nom}`),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_rename-${idCat}-${idGrade}`)
                .setLabel("Modifier le nom")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**Couleur :** ${emoji ? emoji : ""} ${grade.couleur}`,
            ),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_couleur-${idCat}-${idGrade}`)
                .setLabel("Modifier la couleur")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**Description lors d'un rank :** ${grade.subtitle_rank}`,
            ),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_subtitlerank-${idCat}-${idGrade}`)
                .setLabel("Modifier la description de rank")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**Description lors d'un dérank :** ${grade.subtitle_derank}`,
            ),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_subtitlederank-${idCat}-${idGrade}`)
                .setLabel("Modifier la description de dérank")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**${
                grade.role && grade.role.length > 1
                  ? "Rôles donnés ou enlevé"
                  : "Rôle donné ou enlevé"
              } lors d'un rank ou dérank :**`,
            ),
          )
          .addActionRowComponents((actionRow) =>
            actionRow.setComponents(
              new RoleSelectMenuBuilder()
                .setDisabled(false)
                .setCustomId(`grade_role-${idCat}-${idGrade}`)
                .setPlaceholder(
                  grade.role && grade.role.length > 0
                    ? "Choisit un ou plusieurs rôles"
                    : "Aucun rôle",
                )
                .setDefaultRoles(grade.role)
                .setMinValues(0)
                .setMaxValues(25),
            ),
          )
          .addSeparatorComponents((sep) => sep)
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_back-${idCat}`)
                .setLabel("Retour à la catégorie")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`grade_delete-${idCat}-${idGrade}`)
                .setLabel("Supprimer le grade")
                .setStyle(ButtonStyle.Danger),
            ),
          );

        await interaction.update({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      if (id.startsWith("grade_back-")) {
        const [_, idCat] = id.split("-");
        await interaction.deferUpdate({ flags: MessageFlags.Ephemeral });
        const { container } = await generateGradesContainer(
          interaction.client,
          serveur,
          idCat,
        );
        await interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      if (id.startsWith("grade_role-")) {
        const [_, idCat, idGrade] = id.split("-");
        const grade = roleData.grade.find(
          (g) => g.id === idGrade && g.categorie === idCat,
        );
        if (!grade) return;
        const roleIds = [...interaction.roles.keys()];
        grade.role = roleIds;

        fs.writeFileSync(filePath, JSON.stringify(roleData, null, 2), "utf-8");

        await interaction.deferUpdate({ flags: MessageFlags.Ephemeral });

        const guild = await interaction.client.guilds.fetch(
          "1349379748576366633",
        );

        const emoji = await getGradeEmoji(serveur, guild, idCat, grade);

        const container = new ContainerBuilder()
          .setAccentColor(config.couleur[serveur])
          .addTextDisplayComponents((td) =>
            td.setContent(`## Édition du Grade`),
          )
          .addSeparatorComponents((sep) => sep)
          .addTextDisplayComponents((td) =>
            td.setContent(`**Nom du grade :** ${grade.nom}`),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_rename-${idCat}-${idGrade}`)
                .setLabel("Modifier le nom")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**Couleur :** ${emoji ? emoji : ""} ${grade.couleur}`,
            ),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_couleur-${idCat}-${idGrade}`)
                .setLabel("Modifier la couleur")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**Description lors d'un rank :** ${grade.subtitle_rank}`,
            ),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_subtitlerank-${idCat}-${idGrade}`)
                .setLabel("Modifier la description de rank")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**Description lors d'un dérank :** ${grade.subtitle_derank}`,
            ),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_subtitlederank-${idCat}-${idGrade}`)
                .setLabel("Modifier la description de dérank")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**${
                grade.role && grade.role.length > 1
                  ? "Rôles donnés ou enlevé"
                  : "Rôle donné ou enlevé"
              } lors d'un rank ou dérank :**`,
            ),
          )
          .addActionRowComponents((actionRow) =>
            actionRow.setComponents(
              new RoleSelectMenuBuilder()
                .setDisabled(false)
                .setCustomId(`grade_role-${idCat}-${idGrade}`)
                .setPlaceholder(
                  grade.role && grade.role.length > 0
                    ? "Choisit un ou plusieurs rôles"
                    : "Aucun rôle",
                )
                .setDefaultRoles(grade.role)
                .setMinValues(0)
                .setMaxValues(25),
            ),
          )
          .addSeparatorComponents((sep) => sep)
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_back-${idCat}`)
                .setLabel("Retour à la catégorie")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`grade_delete-${idCat}-${idGrade}`)
                .setLabel("Supprimer le grade")
                .setStyle(ButtonStyle.Danger),
            ),
          );
        return interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      if (id.startsWith("grade_rename-")) {
        const [_, idCat, idGrade] = id.split("-");
        const grade = roleData.grade.find(
          (g) => g.id === idGrade && g.categorie === idCat,
        );
        if (!grade) return;

        const modal = new ModalBuilder()
          .setCustomId(`modal_nom_grade-${idCat}-${idGrade}`)
          .setTitle(`Modifier le nom de ${grade.nom}`)
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("grade_nom")
                .setLabel("Nom du grade")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setValue(grade.nom),
            ),
          );
        return interaction.showModal(modal);
      }

      if (id.startsWith("grade_couleur-")) {
        const [_, idCat, idGrade] = id.split("-");
        const grade = roleData.grade.find(
          (g) => g.id === idGrade && g.categorie === idCat,
        );
        if (!grade) return;

        const modal = new ModalBuilder()
          .setCustomId(`modal_couleur_grade-${idCat}-${idGrade}`)
          .setTitle(`Modifier la couleur de ${grade.nom}`)
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("grade_couleur")
                .setLabel("Couleur du grade")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setValue(grade.couleur),
            ),
          );
        return interaction.showModal(modal);
      }

      if (id.startsWith("grade_subtitlerank-")) {
        const [_, idCat, idGrade] = id.split("-");
        const grade = roleData.grade.find(
          (g) => g.id === idGrade && g.categorie === idCat,
        );
        if (!grade) return;

        function truncate(str, max = 45) {
          return str.length > max ? str.slice(0, max - 3) + "..." : str;
        }

        const modal = new ModalBuilder()
          .setCustomId(`modal_subtitlerank_grade-${idCat}-${idGrade}`)
          .setTitle(truncate(`Modifier la description rank de ${grade.nom}`))
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("grade_subtitlerank")
                .setLabel("Description du rank")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setValue(grade.subtitle_rank),
            ),
          );
        return interaction.showModal(modal);
      }

      if (id.startsWith("grade_subtitlederank-")) {
        const [_, idCat, idGrade] = id.split("-");
        const grade = roleData.grade.find(
          (g) => g.id === idGrade && g.categorie === idCat,
        );
        if (!grade) return;

        function truncate(str, max = 45) {
          return str.length > max ? str.slice(0, max - 3) + "..." : str;
        }

        const modal = new ModalBuilder()
          .setCustomId(`modal_subtitlederank_grade-${idCat}-${idGrade}`)
          .setTitle(truncate(`Modifier la description dérank de ${grade.nom}`))
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("grade_subtitlederank")
                .setLabel("Description du dérank")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setValue(grade.subtitle_derank),
            ),
          );
        return interaction.showModal(modal);
      }

      if (id.startsWith("grade_delete-")) {
        const [_, idCat, idGrade] = id.split("-");
        roleData.grade = roleData.grade.filter(
          (g) => !(g.id === idGrade && g.categorie === idCat),
        );
        fs.writeFileSync(filePath, JSON.stringify(roleData, null, 2), "utf-8");

        await interaction.deferUpdate({ flags: MessageFlags.Ephemeral });
        const { container } = await generateGradesContainer(
          interaction.client,
          serveur,
          idCat,
        );
        await interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
    }

    if (interaction.type === InteractionType.ModalSubmit) {
      const id = interaction.customId;

      if (id === "modal_create_categorie") {
        const nom = interaction.fields.getTextInputValue("categorie_name");
        if (!roleData.categorie) roleData.categorie = [];
        if (roleData.categorie.find((c) => c.nom === nom)) {
          const erreurContainer = new ContainerBuilder()
            .setAccentColor(config.colors.error)
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent(`La catégorie **${nom}** existe déjà.`),
            );
          return interaction.reply({
            components: [erreurContainer],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          });
        }

        function getNextCategorieId() {
          const ids = roleData.categorie.map((c) => Number(c.id));
          let idJson = 1;
          while (ids.includes(idJson)) idJson++;
          return idJson.toString();
        }
        const newCategorieId = getNextCategorieId();

        roleData.categorie.push({ id: newCategorieId, nom, role: [] });
        fs.writeFileSync(filePath, JSON.stringify(roleData, null, 2), "utf-8");

        const container = await generateContainer(serveur);
        return interaction.update({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      if (id.startsWith("modal_edit_categorie-")) {
        const idCat = id.replace("modal_edit_categorie-", "");
        const nouveauNom =
          interaction.fields.getTextInputValue("categorie_name");
        if (roleData.categorie.find((c) => c.nom === nouveauNom)) {
          const erreurContainer = new ContainerBuilder()
            .setAccentColor(config.colors.error)
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent(
                `La catégorie **${nouveauNom}** existe déjà.`,
              ),
            );
          return interaction.reply({
            components: [erreurContainer],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          });
        }

        const categorie = roleData.categorie.find((c) => c.id === idCat);

        roleData.categorie = roleData.categorie.map((c) =>
          c.id === idCat ? { ...c, nom: nouveauNom } : c,
        );

        fs.writeFileSync(filePath, JSON.stringify(roleData, null, 2), "utf-8");

        const container = new ContainerBuilder()
          .setAccentColor(config.couleur[serveur])
          .addTextDisplayComponents((td) =>
            td.setContent(`## Édition de la catégorie`),
          )
          .addSeparatorComponents((sep) => sep)
          .addTextDisplayComponents((td) =>
            td.setContent(`**Nom de la catégorie :** ${nouveauNom}`),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_categorie_rename-${idCat}`)
                .setLabel("Modifier le nom")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**${
                categorie.role && categorie.role.length > 1
                  ? "Rôles mentionnés"
                  : "Rôle mentionné"
              } lors d'un rank ou dérank :**`,
            ),
          )
          .addActionRowComponents((actionRow) =>
            actionRow.setComponents(
              new RoleSelectMenuBuilder()
                .setDisabled(false)
                .setCustomId(`grade_categorie_role-${idCat}`)
                .setPlaceholder(
                  categorie.role && categorie.role.length > 0
                    ? "Choisit un ou plusieurs rôles"
                    : "Aucun rôle",
                )
                .setDefaultRoles(categorie.role)
                .setMinValues(0)
                .setMaxValues(25),
            ),
          )
          .addSeparatorComponents((sep) => sep)
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("categorie_grade_back")
                .setLabel("Retour aux catégories")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`grade_categorie_delete-${idCat}`)
                .setLabel("Supprimer la catégorie")
                .setStyle(ButtonStyle.Danger),
            ),
          );
        return interaction.update({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      if (id.startsWith("modal_create_grade-")) {
        const idCat = id.replace("modal_create_grade-", "");
        const nom = interaction.fields.getTextInputValue("grade_nom");
        let couleur = interaction.fields.getTextInputValue("grade_couleur");
        couleur = formatHexColor(couleur);
        if (!couleur) {
          const erreurContainer = new ContainerBuilder()
            .setAccentColor(config.colors.error)
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent(
                "La couleur hexadécimale est invalide. Exemple valide : #FF0000",
              ),
            );
          return interaction.reply({
            components: [erreurContainer],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          });
        }

        if (!roleData.grade) roleData.grade = [];
        if (
          roleData.grade.find((g) => g.nom === nom && g.categorie === idCat)
        ) {
          const erreurContainer = new ContainerBuilder()
            .setAccentColor(config.colors.error)
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent(
                `Le grade **${nom}** existe déjà dans la catégorie ayant l'ID **${idCat}**.`,
              ),
            );
          return interaction.reply({
            components: [erreurContainer],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          });
        }

        function getNextGradeId() {
          const ids = roleData.grade.map((c) => Number(c.id));
          let idJson = 1;
          while (ids.includes(idJson)) idJson++;
          return idJson.toString();
        }
        const newGradeId = getNextGradeId();

        const grade = {
          id: newGradeId,
          nom,
          couleur,
          categorie: idCat,
          subtitle_rank: `Rejoint l'équipe des ${nom}s`,
          subtitle_derank: `Quitte l'équipe des ${nom}s`,
          role: [],
        };
        roleData.grade.push(grade);
        fs.writeFileSync(filePath, JSON.stringify(roleData, null, 2), "utf-8");

        await interaction.deferUpdate({ flags: MessageFlags.Ephemeral });

        const guild = await interaction.client.guilds.fetch(
          "1349379748576366633",
        );

        const emoji = await getGradeEmoji(serveur, guild, idCat, grade);

        const container = new ContainerBuilder()
          .setAccentColor(config.couleur[serveur])
          .addTextDisplayComponents((td) =>
            td.setContent(`## Édition du Grade`),
          )
          .addSeparatorComponents((sep) => sep)
          .addTextDisplayComponents((td) =>
            td.setContent(`**Nom du grade :** ${nom}`),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_rename-${idCat}-${newGradeId}`)
                .setLabel("Modifier le nom")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(`**Couleur :** ${emoji ? emoji : ""} ${couleur}`),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_couleur-${idCat}-${newGradeId}`)
                .setLabel("Modifier la couleur")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**Description lors d'un rank :** ${grade.subtitle_rank}`,
            ),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_subtitlerank-${idCat}-${newGradeId}`)
                .setLabel("Modifier la description de rank")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**Description lors d'un dérank :** ${grade.subtitle_derank}`,
            ),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_subtitlederank-${idCat}-${newGradeId}`)
                .setLabel("Modifier la description de dérank")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              "**Rôle donné ou enlevé lors d'un rank ou dérank :**",
            ),
          )
          .addActionRowComponents((actionRow) =>
            actionRow.setComponents(
              new RoleSelectMenuBuilder()
                .setDisabled(false)
                .setCustomId(`grade_role-${idCat}-${newGradeId}`)
                .setPlaceholder("Aucun rôle")
                .setDefaultRoles([])
                .setMinValues(0)
                .setMaxValues(25),
            ),
          )
          .addSeparatorComponents((sep) => sep)
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_back-${idCat}`)
                .setLabel("Retour à la catégorie")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`grade_delete-${idCat}-${newGradeId}`)
                .setLabel("Supprimer le grade")
                .setStyle(ButtonStyle.Danger),
            ),
          );
        await interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      if (id.startsWith("modal_nom_grade-")) {
        const [_, idCat, idGrade] = id.split("-");
        const nom = interaction.fields.getTextInputValue("grade_nom");
        const grade = roleData.grade.find(
          (g) => g.id === idGrade && g.categorie === idCat,
        );
        const categorie = roleData.categorie.find((c) => c.id === idCat);

        if (
          roleData.grade.find(
            (g) => g.id === idGrade && g.categorie === idCat,
          ) &&
          grade.nom !== nom
        ) {
          const erreurContainer = new ContainerBuilder()
            .setAccentColor(config.colors.error)
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent(
                `Le grade **${nom}** existe déjà dans la catégorie **${categorie.nom}**.`,
              ),
            );
          return interaction.reply({
            components: [erreurContainer],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          });
        }

        roleData.grade = roleData.grade.map((g) =>
          g.id === idGrade && g.categorie === idCat ? { ...g, nom } : g,
        );

        fs.writeFileSync(filePath, JSON.stringify(roleData, null, 2), "utf-8");

        await interaction.deferUpdate({ flags: MessageFlags.Ephemeral });

        const guild = await interaction.client.guilds.fetch(
          "1349379748576366633",
        );

        const emoji = await getGradeEmoji(serveur, guild, idCat, grade);

        const container = new ContainerBuilder()
          .setAccentColor(config.couleur[serveur])
          .addTextDisplayComponents((td) =>
            td.setContent(`## Édition du Grade`),
          )
          .addSeparatorComponents((sep) => sep)
          .addTextDisplayComponents((td) =>
            td.setContent(`**Nom du grade :** ${grade.nom}`),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_rename-${idCat}-${idGrade}`)
                .setLabel("Modifier le nom")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**Couleur :** ${emoji ? emoji : ""} ${grade.couleur}`,
            ),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_couleur-${idCat}-${idGrade}`)
                .setLabel("Modifier la couleur")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**Description lors d'un rank :** ${grade.subtitle_rank}`,
            ),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_subtitlerank-${idCat}-${idGrade}`)
                .setLabel("Modifier la description de rank")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**Description lors d'un dérank :** ${grade.subtitle_derank}`,
            ),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_subtitlederank-${idCat}-${idGrade}`)
                .setLabel("Modifier la description de dérank")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**${
                grade.role && grade.role.length > 1
                  ? "Rôles donnés ou enlevé"
                  : "Rôle donné ou enlevé"
              } lors d'un rank ou dérank :**`,
            ),
          )
          .addActionRowComponents((actionRow) =>
            actionRow.setComponents(
              new RoleSelectMenuBuilder()
                .setDisabled(false)
                .setCustomId(`grade_role-${idCat}-${idGrade}`)
                .setPlaceholder(
                  grade.role && grade.role.length > 0
                    ? "Choisit un ou plusieurs rôles"
                    : "Aucun rôle",
                )
                .setDefaultRoles(grade.role)
                .setMinValues(0)
                .setMaxValues(25),
            ),
          )
          .addSeparatorComponents((sep) => sep)
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_back-${idCat}`)
                .setLabel("Retour à la catégorie")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`grade_delete-${idCat}-${idGrade}`)
                .setLabel("Supprimer le grade")
                .setStyle(ButtonStyle.Danger),
            ),
          );
        await interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      if (id.startsWith("modal_couleur_grade-")) {
        const [_, idCat, idGrade] = id.split("-");
        let couleur =
          interaction.fields.getTextInputValue("grade_couleur") || "";
        couleur = formatHexColor(couleur);
        if (!couleur)
          return interaction.reply({
            content: "Couleur HEX invalide. Exemple valide : #FF00FF",
            flags: MessageFlags.Ephemeral,
          });

        const grade = roleData.grade.find(
          (g) => g.id === idGrade && g.categorie === idCat,
        );
        grade.couleur = couleur;

        fs.writeFileSync(filePath, JSON.stringify(roleData, null, 2), "utf-8");

        await interaction.deferUpdate({ flags: MessageFlags.Ephemeral });

        const guild = await interaction.client.guilds.fetch(
          "1349379748576366633",
        );

        const emoji = await getGradeEmoji(serveur, guild, idCat, grade);

        const container = new ContainerBuilder()
          .setAccentColor(config.couleur[serveur])
          .addTextDisplayComponents((td) =>
            td.setContent(`## Édition du Grade`),
          )
          .addSeparatorComponents((sep) => sep)
          .addTextDisplayComponents((td) =>
            td.setContent(`**Nom du grade :** ${grade.nom}`),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_rename-${idCat}-${idGrade}`)
                .setLabel("Modifier le nom")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(`**Couleur :** ${emoji ? emoji : ""} ${couleur}`),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_couleur-${idCat}-${idGrade}`)
                .setLabel("Modifier la couleur")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**Description lors d'un rank :** ${grade.subtitle_rank}`,
            ),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_subtitlerank-${idCat}-${idGrade}`)
                .setLabel("Modifier la description de rank")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**Description lors d'un dérank :** ${grade.subtitle_derank}`,
            ),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_subtitlederank-${idCat}-${idGrade}`)
                .setLabel("Modifier la description de dérank")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**${
                grade.role && grade.role.length > 1
                  ? "Rôles donnés ou enlevé"
                  : "Rôle donné ou enlevé"
              } lors d'un rank ou dérank :**`,
            ),
          )
          .addActionRowComponents((actionRow) =>
            actionRow.setComponents(
              new RoleSelectMenuBuilder()
                .setDisabled(false)
                .setCustomId(`grade_role-${idCat}-${idGrade}`)
                .setPlaceholder(
                  grade.role && grade.role.length > 0
                    ? "Choisit un ou plusieurs rôles"
                    : "Aucun rôle",
                )
                .setDefaultRoles(grade.role)
                .setMinValues(0)
                .setMaxValues(25),
            ),
          )
          .addSeparatorComponents((sep) => sep)
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_back-${idCat}`)
                .setLabel("Retour à la catégorie")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`grade_delete-${idCat}-${idGrade}`)
                .setLabel("Supprimer le grade")
                .setStyle(ButtonStyle.Danger),
            ),
          );
        await interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      if (id.startsWith("modal_subtitlerank_grade-")) {
        const [_, idCat, idGrade] = id.split("-");
        let subtitle_rank =
          interaction.fields.getTextInputValue("grade_subtitlerank") || "";

        const grade = roleData.grade.find(
          (g) => g.id === idGrade && g.categorie === idCat,
        );
        grade.subtitle_rank = subtitle_rank;

        fs.writeFileSync(filePath, JSON.stringify(roleData, null, 2), "utf-8");

        await interaction.deferUpdate({ flags: MessageFlags.Ephemeral });

        const guild = await interaction.client.guilds.fetch(
          "1349379748576366633",
        );

        const emoji = await getGradeEmoji(serveur, guild, idCat, grade);

        const container = new ContainerBuilder()
          .setAccentColor(config.couleur[serveur])
          .addTextDisplayComponents((td) =>
            td.setContent(`## Édition du Grade`),
          )
          .addSeparatorComponents((sep) => sep)
          .addTextDisplayComponents((td) =>
            td.setContent(`**Nom du grade :** ${grade.nom}`),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_rename-${idCat}-${idGrade}`)
                .setLabel("Modifier le nom")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**Couleur :** ${emoji ? emoji : ""} ${grade.couleur}`,
            ),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_couleur-${idCat}-${idGrade}}`)
                .setLabel("Modifier la couleur")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**Description lors d'un rank :** ${grade.subtitle_rank}`,
            ),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_subtitlerank-${idCat}-${idGrade}`)
                .setLabel("Modifier la description de rank")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**Description lors d'un dérank :** ${grade.subtitle_derank}`,
            ),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_subtitlederank-${idCat}-${idGrade}`)
                .setLabel("Modifier la description de dérank")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**${
                grade.role && grade.role.length > 1
                  ? "Rôles donnés ou enlevé"
                  : "Rôle donné ou enlevé"
              } lors d'un rank ou dérank :**`,
            ),
          )
          .addActionRowComponents((actionRow) =>
            actionRow.setComponents(
              new RoleSelectMenuBuilder()
                .setDisabled(false)
                .setCustomId(`grade_role-${idCat}-${idGrade}`)
                .setPlaceholder(
                  grade.role && grade.role.length > 0
                    ? "Choisit un ou plusieurs rôles"
                    : "Aucun rôle",
                )
                .setDefaultRoles(grade.role)
                .setMinValues(0)
                .setMaxValues(25),
            ),
          )
          .addSeparatorComponents((sep) => sep)
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_back-${idCat}`)
                .setLabel("Retour à la catégorie")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`grade_delete-${idCat}-${idGrade}`)
                .setLabel("Supprimer le grade")
                .setStyle(ButtonStyle.Danger),
            ),
          );
        await interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      if (id.startsWith("modal_subtitlederank_grade-")) {
        const [_, idCat, idGrade] = id.split("-");
        let subtitle_derank =
          interaction.fields.getTextInputValue("grade_subtitlederank") || "";

        const grade = roleData.grade.find(
          (g) => g.id === idGrade && g.categorie === idCat,
        );
        grade.subtitle_derank = subtitle_derank;

        fs.writeFileSync(filePath, JSON.stringify(roleData, null, 2), "utf-8");

        await interaction.deferUpdate({ flags: MessageFlags.Ephemeral });

        const guild = await interaction.client.guilds.fetch(
          "1349379748576366633",
        );

        const emoji = await getGradeEmoji(serveur, guild, idCat, grade);

        const container = new ContainerBuilder()
          .setAccentColor(config.couleur[serveur])
          .addTextDisplayComponents((td) =>
            td.setContent(`## Édition du Grade`),
          )
          .addSeparatorComponents((sep) => sep)
          .addTextDisplayComponents((td) =>
            td.setContent(`**Nom du grade :** ${grade.nom}`),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_rename-${idCat}-${idGrade}`)
                .setLabel("Modifier le nom")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**Couleur :** ${emoji ? emoji : ""} ${grade.couleur}`,
            ),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_couleur-${idCat}-${idGrade}`)
                .setLabel("Modifier la couleur")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**Description lors d'un rank :** ${grade.subtitle_rank}`,
            ),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_subtitlerank-${idCat}-${idGrade}`)
                .setLabel("Modifier la description de rank")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**Description lors d'un dérank :** ${grade.subtitle_derank}`,
            ),
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_subtitlederank-${idCat}-${idGrade}`)
                .setLabel("Modifier la description de dérank")
                .setStyle(ButtonStyle.Primary),
            ),
          )
          .addTextDisplayComponents((td) =>
            td.setContent(
              `**${
                grade.role && grade.role.length > 1
                  ? "Rôles donnés ou enlevé"
                  : "Rôle donné ou enlevé"
              } lors d'un rank ou dérank :**`,
            ),
          )
          .addActionRowComponents((actionRow) =>
            actionRow.setComponents(
              new RoleSelectMenuBuilder()
                .setDisabled(false)
                .setCustomId(`grade_role-${idCat}-${idGrade}`)
                .setPlaceholder(
                  grade.role && grade.role.length > 0
                    ? "Choisit un ou plusieurs rôles"
                    : "Aucun rôle",
                )
                .setDefaultRoles(grade.role)
                .setMinValues(0)
                .setMaxValues(25),
            ),
          )
          .addSeparatorComponents((sep) => sep)
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`grade_back-${idCat}`)
                .setLabel("Retour à la catégorie")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`grade_delete-${idCat}-${idGrade}`)
                .setLabel("Supprimer le grade")
                .setStyle(ButtonStyle.Danger),
            ),
          );
        await interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
    }
  } catch (e) {
    console.error("Erreur dans handleInteraction:", e);
  }
}

module.exports = {
  handleInteraction,
  getGradeEmoji,
  formatHexColor,
  generateContainer,
  generateGradesContainer,
};
