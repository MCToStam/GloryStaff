const {
  SlashCommandBuilder,
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  StringSelectMenuBuilder,
} = require("discord.js");
const proxyCommande = require("../../../util/proxy/proxyCommande");
const Grade = require("../../../util/database/models/Grade");
const { replyOrUpdate } = require("../../../util/proxy/reply");

module.exports = {
  config: { permission: "super_moderateur" },
  data: new SlashCommandBuilder()
    .setName("grade")
    .setDescription("Configure les différents grades"),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur } = interaction.parametre;

    const doc = await Grade.findOne({ serveur });
    const categories = doc?.categorie || [];

    const gradeContainer = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## 📁 Gestion des Catégories"),
      )
      .addSeparatorComponents((separator) => separator);

    if (categories.length > 0) {
      categories.forEach((cat) => {
        const nom = cat.nom || "Nom inconnu";
        gradeContainer
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(`\n- **${nom}**`),
          )
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
      gradeContainer.addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("Aucune catégorie n'a encore été créée"),
      );
    }

    const options = categories.map((cat) => ({
      label: cat.nom,
      value: `grade_categorie_manage-${cat.id}`,
    }));

    gradeContainer.addSeparatorComponents((separator) => separator);

    if (options.length > 0) {
      gradeContainer
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

    gradeContainer.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("grade_categorie_create")
          .setLabel("➕ Créer une Catégorie")
          .setStyle(ButtonStyle.Success),
      ),
    );

    await replyOrUpdate(interaction, [gradeContainer]);
  },
};
