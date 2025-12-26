const { getData } = require("../../../util/module/getAndSaveData");
const {
  SlashCommandBuilder,
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  StringSelectMenuBuilder,
} = require("discord.js");
const {
  errorStaffContainer,
  discordStaff,
} = require("../../../util/module/discordLink");
const { getServerCommand } = require("../../../util/getServerCommand");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("grade")
    .setDescription("Configure les différents grades")
    .addStringOption((option) =>
      option
        .setName("serveur")
        .setDescription(
          "Le serveur pour lequel afficher la configuration des grades",
        )
        .setRequired(false)
        .setAutocomplete(true),
    ),

  async execute(client, interaction, config) {
    const serveur =
      interaction.options.getString("serveur")?.toLowerCase() ||
      (await getServerCommand(interaction.guild.id));

    const { errorContainer } = await errorStaffContainer(serveur);

    if (errorContainer) {
      return interaction.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const { pseudonym, servers, container } = await discordStaff(
      interaction.user.id,
      serveur,
      "super_moderateur",
    );

    if (container) {
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const configGrade = getData(`data/${serveur}/grade.json`);

    const gradeContainer = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(`## Configuration des Grades`),
      )
      .addSeparatorComponents((separator) => separator);

    const categories = configGrade.categorie || [];

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
                .setCustomId(`grade_categorie_edit_${cat.id}`)
                .setLabel("Modifier la catégorie")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`grade_categorie_delete_${cat.id}`)
                .setLabel("Supprimer la catégorie")
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
      value: cat.id,
    }));

    gradeContainer.addSeparatorComponents((separator) => separator);

    if (options.length > 0) {
      gradeContainer
        .addSeparatorComponents((separator) => separator)
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("grade_categorie_manage")
              .setPlaceholder("Gérer une catégorie")
              .addOptions(options),
          ),
        );
    }

    gradeContainer.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("grade_categorie_create")
          .setLabel("Créer une catégorie")
          .setStyle(ButtonStyle.Success),
      ),
    );

    await interaction.reply({
      components: [gradeContainer],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true,
    });
  },
};
