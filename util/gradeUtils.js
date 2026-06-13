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
} = require("discord.js");
const config = require("../config");
const { getHexEmoji } = require("../util/module/emoji");
const { getServeur } = require("../util/module/getServeur");
const Grade = require("../util/database/models/Grade");

function formatHexColor(input) {
  let color = input.toUpperCase();
  if (!color.startsWith("#")) color = "#" + color;
  if (!/^#[0-9A-F]{6}$/.test(color)) return null;
  return color;
}

async function getOrCreateConfig(serveur) {
  let doc = await Grade.findOne({ serveur });
  if (!doc) doc = await Grade.create({ serveur, categorie: [] });
  return doc;
}

async function generateContainer(serveur) {
  const doc = await getOrCreateConfig(serveur);
  const categories = doc.categorie || [];

  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
    .addTextDisplayComponents((td) =>
      td.setContent("## 📁 Gestion des Catégories"),
    )
    .addSeparatorComponents((sep) => sep);

  if (categories.length > 0) {
    categories.forEach((cat) => {
      container
        .addTextDisplayComponents((td) => td.setContent(`\n- **${cat.nom}**`))
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`grade_categorie_edit-${cat.id}`)
              .setLabel("✏️ Modifier la Catégorie")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`grade_categorie_delete-${cat.id}`)
              .setLabel("🗑️ Supprimer la Catégorie")
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
    value: `grade_categorie_manage-${cat.id}`,
  }));

  container.addSeparatorComponents((separator) => separator);

  if (categories.length > 0) {
    container
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("grade_categorie_manage")
            .setPlaceholder("Gérer une catégorie")
            .addOptions(options),
        ),
      )
      .addSeparatorComponents((separator) => separator);
  }

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("grade_categorie_create")
        .setLabel("➕ Créer une Catégorie")
        .setStyle(ButtonStyle.Success),
    ),
  );

  return container;
}

async function generateGradesContainer(client, serveur, idCat) {
  const doc = await getOrCreateConfig(serveur);
  const categorie = doc.categorie.find((c) => c.id === idCat);
  const grades = categorie ? categorie.grade : [];

  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
    .addTextDisplayComponents((td) =>
      td.setContent(
        `## 👦 Gestion des Grades - ${categorie ? categorie.nom : idCat}`,
      ),
    )
    .addSeparatorComponents((sep) => sep);

  if (grades.length > 0) {
    for (let i = 0; i < grades.length; i++) {
      const g = grades[i];
      const emoji = await getHexEmoji(client, g.couleur);
      container
        .addTextDisplayComponents((td) =>
          td.setContent(`- ${emoji ? emoji : ""} **${g.nom}** (${g.couleur})`),
        )
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`grade_edit-${idCat}-${g.id}`)
              .setLabel("✏️ Modifier le Grade")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`grade_delete-${idCat}-${g.id}`)
              .setLabel("🗑️ Supprimer le Grade")
              .setStyle(ButtonStyle.Danger),
          ),
        );

      if (i < grades.length - 1) {
        container.addSeparatorComponents((sep) => sep);
      }
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
          .setLabel("🚪 Retour aux Catégories")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`grade_create-${idCat}`)
          .setLabel("➕ Créer un Grade")
          .setStyle(ButtonStyle.Success),
      ),
    );

  return { container };
}

function buildGradeEditContainer(serveurCouleur, idCat, grade, emoji) {
  return new ContainerBuilder()
    .setAccentColor(serveurCouleur)
    .addTextDisplayComponents((td) => td.setContent("## ✏️ Édition du Grade"))
    .addSeparatorComponents((sep) => sep)
    .addSectionComponents((section) =>
      section
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(`**Nom du grade :** ${grade.nom}`),
        )
        .setButtonAccessory((button) =>
          button
            .setCustomId(`grade_rename-${idCat}-${grade.id}`)
            .setLabel("Modifier le Nom")
            .setStyle(ButtonStyle.Primary),
        ),
    )
    .addSeparatorComponents((sep) => sep)
    .addSectionComponents((section) =>
      section
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            `**Couleur :** ${emoji ? emoji : ""} ${grade.couleur}`,
          ),
        )
        .setButtonAccessory((button) =>
          button
            .setCustomId(`grade_couleur-${idCat}-${grade.id}`)
            .setLabel("Modifier la Couleur")
            .setStyle(ButtonStyle.Primary),
        ),
    )
    .addSeparatorComponents((sep) => sep)
    .addSectionComponents((section) =>
      section
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            `**Description lors d'un rank :** ${grade.subtitle_rank}`,
          ),
        )
        .setButtonAccessory((button) =>
          button
            .setCustomId(`grade_subtitlerank-${idCat}-${grade.id}`)
            .setLabel("Modifier la Description de Rank")
            .setStyle(ButtonStyle.Primary),
        ),
    )
    .addSeparatorComponents((sep) => sep)
    .addSectionComponents((section) =>
      section
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            `**Description lors d'un dérank :** ${grade.subtitle_derank}`,
          ),
        )
        .setButtonAccessory((button) =>
          button
            .setCustomId(`grade_subtitlederank-${idCat}-${grade.id}`)
            .setLabel("Modifier la Description de Dérank")
            .setStyle(ButtonStyle.Primary),
        ),
    )
    .addSeparatorComponents((sep) => sep)
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
          .setCustomId(`grade_role-${idCat}-${grade.id}`)
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
          .setLabel("🚪 Retour à la Catégorie")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`grade_delete-${idCat}-${grade.id}`)
          .setLabel("🗑️ Supprimer le Grade")
          .setStyle(ButtonStyle.Danger),
      ),
    );
}

function buildCategorieEditContainer(serveurCouleur, idCat, categorie) {
  return new ContainerBuilder()
    .setAccentColor(serveurCouleur)
    .addTextDisplayComponents((td) =>
      td.setContent(`## ✏️ Édition de la Catégorie`),
    )
    .addSeparatorComponents((sep) => sep)
    .addSectionComponents((section) =>
      section
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(`**Nom de la catégorie :** ${categorie.nom}`),
        )
        .setButtonAccessory((button) =>
          button
            .setCustomId(`grade_categorie_rename-${idCat}`)
            .setLabel("Modifier le Nom")
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
          .setLabel("🚪 Retour aux Catégories")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`grade_categorie_delete-${idCat}`)
          .setLabel("🗑️ Supprimer la Catégorie")
          .setStyle(ButtonStyle.Danger),
      ),
    );
}

async function handleInteraction(interaction, client, config) {
  const serveur = await getServeur(interaction);

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
      const idCat = id.replace("grade_categorie_delete-", "");
      const doc = await getOrCreateConfig(serveur);
      doc.categorie = doc.categorie.filter((c) => c.id !== idCat);
      await doc.save();

      const container = await generateContainer(serveur);
      return interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (id.startsWith("grade_categorie_edit-")) {
      const idCat = id.replace("grade_categorie_edit-", "");
      const doc = await getOrCreateConfig(serveur);
      const categorie = doc.categorie.find((c) => c.id === idCat);
      const container = buildCategorieEditContainer(
        config.serveur[serveur].couleur,
        idCat,
        categorie,
      );
      return interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (id.startsWith("grade_categorie_role-")) {
      const idCat = id.replace("grade_categorie_role-", "");
      const roleIds = [...interaction.roles.keys()];
      const doc = await getOrCreateConfig(serveur);
      const categorie = doc.categorie.find((c) => c.id === idCat);
      categorie.role = roleIds;
      await doc.save();

      const container = buildCategorieEditContainer(
        config.serveur[serveur].couleur,
        idCat,
        categorie,
      );
      return interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (id.startsWith("grade_categorie_rename-")) {
      const idCat = id.replace("grade_categorie_rename-", "");
      const doc = await getOrCreateConfig(serveur);
      const categorie = doc.categorie.find((c) => c.id === idCat);
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
      const idCat = interaction.values[0].replace(
        "grade_categorie_manage-",
        "",
      );
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
      const doc = await getOrCreateConfig(serveur);
      const categorie = doc.categorie.find((c) => c.id === idCat);
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
      const doc = await getOrCreateConfig(serveur);
      const categorie = doc.categorie.find((c) => c.id === idCat);
      const grade = categorie?.grade.find((g) => g.id === idGrade);
      if (!grade) return;

      const emoji = await getHexEmoji(client, grade.couleur);
      const container = buildGradeEditContainer(
        config.serveur[serveur].couleur,
        idCat,
        grade,
        emoji,
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
      const roleIds = [...interaction.roles.keys()];
      const doc = await getOrCreateConfig(serveur);
      const categorie = doc.categorie.find((c) => c.id === idCat);
      const grade = categorie?.grade.find((g) => g.id === idGrade);
      if (!grade) return;
      grade.role = roleIds;
      await doc.save();

      await interaction.deferUpdate({ flags: MessageFlags.Ephemeral });
      const emoji = await getHexEmoji(client, grade.couleur);
      const container = buildGradeEditContainer(
        config.serveur[serveur].couleur,
        idCat,
        grade,
        emoji,
      );
      return interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (id.startsWith("grade_rename-")) {
      const [_, idCat, idGrade] = id.split("-");
      const doc = await getOrCreateConfig(serveur);
      const categorie = doc.categorie.find((c) => c.id === idCat);
      const grade = categorie?.grade.find((g) => g.id === idGrade);
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
      const doc = await getOrCreateConfig(serveur);
      const categorie = doc.categorie.find((c) => c.id === idCat);
      const grade = categorie?.grade.find((g) => g.id === idGrade);
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
      const doc = await getOrCreateConfig(serveur);
      const categorie = doc.categorie.find((c) => c.id === idCat);
      const grade = categorie?.grade.find((g) => g.id === idGrade);
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
      const doc = await getOrCreateConfig(serveur);
      const categorie = doc.categorie.find((c) => c.id === idCat);
      const grade = categorie?.grade.find((g) => g.id === idGrade);
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
      const doc = await getOrCreateConfig(serveur);
      const categorie = doc.categorie.find((c) => c.id === idCat);
      if (categorie) {
        categorie.grade = categorie.grade.filter((g) => g.id !== idGrade);
        await doc.save();
      }

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
      const doc = await getOrCreateConfig(serveur);

      if (doc.categorie.find((c) => c.nom === nom)) {
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

      const ids = doc.categorie.map((c) => Number(c.id));
      let newId = 1;
      while (ids.includes(newId)) newId++;

      doc.categorie.push({ id: newId.toString(), nom, role: [], grade: [] });
      await doc.save();

      const container = await generateContainer(serveur);
      return interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (id.startsWith("modal_edit_categorie-")) {
      const idCat = id.replace("modal_edit_categorie-", "");
      const nouveauNom = interaction.fields.getTextInputValue("categorie_name");
      const doc = await getOrCreateConfig(serveur);

      if (doc.categorie.find((c) => c.nom === nouveauNom)) {
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

      const categorie = doc.categorie.find((c) => c.id === idCat);
      categorie.nom = nouveauNom;
      await doc.save();

      const container = buildCategorieEditContainer(
        config.serveur[serveur].couleur,
        idCat,
        categorie,
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

      const doc = await getOrCreateConfig(serveur);
      const categorie = doc.categorie.find((c) => c.id === idCat);

      if (categorie.grade.find((g) => g.nom === nom)) {
        const erreurContainer = new ContainerBuilder()
          .setAccentColor(config.colors.error)
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent("## ❌ Nom déjà Utilisé"),
          )
          .addSeparatorComponents((sep) => sep)
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

      const allGradeIds = doc.categorie.flatMap((c) =>
        c.grade.map((g) => Number(g.id)),
      );
      let newGradeId = 1;
      while (allGradeIds.includes(newGradeId)) newGradeId++;

      const grade = {
        id: newGradeId.toString(),
        nom,
        couleur,
        subtitle_rank: `Rejoint l'équipe des ${nom}s`,
        subtitle_derank: `Quitte l'équipe des ${nom}s`,
        role: [],
      };
      categorie.grade.push(grade);
      await doc.save();

      await interaction.deferUpdate({ flags: MessageFlags.Ephemeral });
      const emoji = await getHexEmoji(client, grade.couleur);
      const container = buildGradeEditContainer(
        config.serveur[serveur].couleur,
        idCat,
        grade,
        emoji,
      );
      await interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (id.startsWith("modal_nom_grade-")) {
      const [_, idCat, idGrade] = id.split("-");
      const nom = interaction.fields.getTextInputValue("grade_nom");
      const doc = await getOrCreateConfig(serveur);
      const categorie = doc.categorie.find((c) => c.id === idCat);
      const grade = categorie?.grade.find((g) => g.id === idGrade);

      if (categorie.grade.find((g) => g.nom === nom)) {
        const erreurContainer = new ContainerBuilder()
          .setAccentColor(config.colors.error)
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent("## ❌ Nom déjà Utilisé"),
          )
          .addSeparatorComponents((sep) => sep)
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

      grade.nom = nom;
      await doc.save();

      await interaction.deferUpdate({ flags: MessageFlags.Ephemeral });
      const emoji = await getHexEmoji(client, grade.couleur);
      const container = buildGradeEditContainer(
        config.serveur[serveur].couleur,
        idCat,
        grade,
        emoji,
      );
      await interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (id.startsWith("modal_couleur_grade-")) {
      const [_, idCat, idGrade] = id.split("-");
      let couleur = interaction.fields.getTextInputValue("grade_couleur") || "";
      couleur = formatHexColor(couleur);
      if (!couleur)
        return interaction.reply({
          content: "Couleur HEX invalide. Exemple valide : #FF00FF",
          flags: MessageFlags.Ephemeral,
        });

      const doc = await getOrCreateConfig(serveur);
      const categorie = doc.categorie.find((c) => c.id === idCat);
      const grade = categorie?.grade.find((g) => g.id === idGrade);
      grade.couleur = couleur;
      await doc.save();

      await interaction.deferUpdate({ flags: MessageFlags.Ephemeral });
      const emoji = await getHexEmoji(client, grade.couleur);
      const container = buildGradeEditContainer(
        config.serveur[serveur].couleur,
        idCat,
        grade,
        emoji,
      );
      await interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (id.startsWith("modal_subtitlerank_grade-")) {
      const [_, idCat, idGrade] = id.split("-");
      const subtitle_rank =
        interaction.fields.getTextInputValue("grade_subtitlerank") || "";
      const doc = await getOrCreateConfig(serveur);
      const categorie = doc.categorie.find((c) => c.id === idCat);
      const grade = categorie?.grade.find((g) => g.id === idGrade);
      grade.subtitle_rank = subtitle_rank;
      await doc.save();

      await interaction.deferUpdate({ flags: MessageFlags.Ephemeral });
      const emoji = await getHexEmoji(client, grade.couleur);
      const container = buildGradeEditContainer(
        config.serveur[serveur].couleur,
        idCat,
        grade,
        emoji,
      );
      await interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (id.startsWith("modal_subtitlederank_grade-")) {
      const [_, idCat, idGrade] = id.split("-");
      const subtitle_derank =
        interaction.fields.getTextInputValue("grade_subtitlederank") || "";
      const doc = await getOrCreateConfig(serveur);
      const categorie = doc.categorie.find((c) => c.id === idCat);
      const grade = categorie?.grade.find((g) => g.id === idGrade);
      grade.subtitle_derank = subtitle_derank;
      await doc.save();

      await interaction.deferUpdate({ flags: MessageFlags.Ephemeral });
      const emoji = await getHexEmoji(client, grade.couleur);
      const container = buildGradeEditContainer(
        config.serveur[serveur].couleur,
        idCat,
        grade,
        emoji,
      );
      await interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }
  }
}

module.exports = {
  handleInteraction,
  formatHexColor,
  generateContainer,
  generateGradesContainer,
};
