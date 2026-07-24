const {
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  ModalBuilder,
  LabelBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const { getServeur } = require("../../../../util/module/getServeur");
const RecapitulatifAssaut = require("../../../../util/database/models/RecapitulatifAssaut");
const Configuration = require("../../../../util/database/models/Configuration");
const Serveur = require("../../../../util/database/models/Serveur");

module.exports = {
  data: {
    name: "recap_assaut",
  },

  async execute(client, interaction, config) {
    const [_, categorie, id] = interaction.customId.split("-");
    const serveur = await getServeur(interaction);

    if (categorie === "staff") {
      const recap = await RecapitulatifAssaut.findOne({ _id: id }).lean();
      const serveurData = await Serveur.findOne({ serveur: serveur }).lean();

      const configAssaut = await Configuration.findOne({
        serveur,
        guildId: interaction.guild.id,
        categorie: "Récapitulatif Assaut",
        systeme: "Récapitulatif Assaut",
      });

      const modal = new ModalBuilder()
        .setCustomId(`recap_assaut-${categorie}-${id}`)
        .setTitle("Récapitulatif d'Assaut");

      const gradeMin = configAssaut.data.get("Grade");
      const prioriteMin = config.grade[gradeMin].priorite;

      const grades = Object.entries(config.grade)
        .filter(
          ([key, value]) => key !== "guide" && value.priorite >= prioriteMin,
        )
        .sort((a, b) => b[1].priorite - a[1].priorite);

      for (const [key, infos] of grades) {
        const membres = serveurData.staff[key] ?? [];

        const select = new StringSelectMenuBuilder()
          .setCustomId(`grade_${key}`)
          .setPlaceholder(`Choisir un ${infos.nom.normal}`)
          .setRequired(false)
          .setMaxValues(membres.length)
          .addOptions(
            membres.map((membre) =>
              new StringSelectMenuOptionBuilder()
                .setLabel(membre)
                .setValue(membre)
                .setDefault(recap.staff.includes(membre)),
            ),
          );

        const label = new LabelBuilder()
          .setLabel(infos.nom.pluriel)
          .setStringSelectMenuComponent(select);

        modal.addLabelComponents(label);
      }

      await interaction.showModal(modal);
    } else if (categorie === "explosion") {
      const explosion = [
        // Tier 1
        { label: "Répulsif", value: "Répulsif", description: "Missile T1" },
        {
          label: "Conventionnel",
          value: "Conventionnel",
          description: "Missile T1",
        },
        { label: "Attractive", value: "Attractive", description: "Missile T1" },
        {
          label: "Débilitation",
          value: "Débilitation",
          description: "Missile T1",
        },
        { label: "Chemical", value: "Chemical", description: "Missile T1" },

        // Tier 2
        {
          label: "Fragmentation",
          value: "Fragmentation",
          description: "Missile T2",
        },
        { label: "Breaching", value: "Breaching", description: "Missile T2" },
        { label: "Sonic", value: "Sonic", description: "Missile T2" },
        { label: "Cluster", value: "Cluster", description: "Missile T2" },
        {
          label: "Incendiaire",
          value: "Incendiaire",
          description: "Missile T2",
        },
        { label: "Contagious", value: "Contagious", description: "Missile T2" },
        { label: "EMP", value: "EMP", description: "Missile T2" },
        {
          label: "Anti Ballistic",
          value: "Anti Ballistic",
          description: "Missile T2",
        },

        // Tier 3
        {
          label: "Thermobarique",
          value: "Thermobarique",
          description: "Missile T3",
        },
        { label: "Nucléaire", value: "Nucléaire", description: "Missile T3" },
        {
          label: "Nucléaire Fragmentation",
          value: "Nucléaire Fragmentation",
          description: "Missile T3",
        },
        {
          label: "Hyper Sonic",
          value: "Hyper Sonic",
          description: "Missile T3",
        },
        { label: "Mega Sonic", value: "Mega Sonic", description: "Missile T3" },
        {
          label: "Endothermique",
          value: "Endothermique",
          description: "Missile T3",
        },
        { label: "Drill", value: "Drill", description: "Missile T3" },
        { label: "Earthquake", value: "Earthquake", description: "Missile T3" },
        { label: "Magnétique", value: "Magnétique", description: "Missile T3" },

        // Tier 4
        { label: "Redmatter", value: "Redmatter", description: "Missile T4" },
        { label: "Antimatter", value: "Antimatter", description: "Missile T4" },

        // Tier 5
        { label: "Endbringer", value: "Endbringer", description: "Missile T5" },
      ];

      const modal = new ModalBuilder()
        .setCustomId(`recap_assaut-${categorie}-${id}`)
        .setTitle("Récapitulatif d'Assaut");

      const explosionType = new StringSelectMenuBuilder()
        .setCustomId("type_explosion")
        .setPlaceholder("Type d'explosion")
        .addOptions(...explosion);

      const coordX = new TextInputBuilder()
        .setCustomId("coord_x")
        .setLabel("Coordonné X de l'explosion")
        .setStyle(TextInputStyle.Short);

      const coordZ = new TextInputBuilder()
        .setCustomId("coord_z")
        .setLabel("Coordonné Z de l'explosion")
        .setStyle(TextInputStyle.Short);

      modal.addComponents(
        new ActionRowBuilder().addComponents(explosionType),
        new ActionRowBuilder().addComponents(coordX),
        new ActionRowBuilder().addComponents(coordZ),
      );

      await interaction.showModal(modal);
    }
  },
};
