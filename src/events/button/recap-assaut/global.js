const {
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  ModalBuilder,
  LabelBuilder,
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
        .setCustomId("recap_assaut")
        .setTitle("Récapitulatif d'Assaut");

      const gradeMin = configAssaut.data.get("Grade");
      const prioriteMin = config.grade[gradeMin].priorite;

      const grades = Object.entries(config.grade)
        .filter(
          ([key, value]) => key !== "guide" && value.priorite >= prioriteMin,
        )
        .sort((a, b) => a[1].priorite - b[1].priorite);

      for (const [key, infos] of grades) {
        const membres = serveurData.staff[key] ?? [];

        const select = new StringSelectMenuBuilder()
          .setCustomId(`grade_${key}`)
          .setPlaceholder(`Choisir un ${infos.nom.normal}`)
          .setRequired(false)
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
    }
  },
};
