const {
  StringSelectMenuBuilder,
  MessageFlags,
  ContainerBuilder,
} = require("discord.js");
const { getServeur } = require("../../../../../util/module/getServeur");
const { discordLink } = require("../../../../../util/module/discordLink");
const Configuration = require("../../../../../util/database/models/Configuration");
const Serveur = require("../../../../../util/database/models/Serveur");

module.exports = {
  data: {
    name: "globalstaff_liste",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);
    const linkData = (await discordLink(false))?.data;
    const staffServeur = await Serveur.findOne({
      serveur,
    }).lean();

    const container = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((t) =>
        t.setContent("## <:liste:1441495206229835979> Liste des Staffs"),
      )
      .addSeparatorComponents((s) => s);

    for (const [grade, members] of Object.entries(staffServeur.staff)) {
      const memberNames = members
        .map((name) => {
          const linkedId = Object.keys(linkData).find(
            (id) => linkData[id] === name,
          );
          const escapedName = name.replace(/_/g, "\\_");
          return linkedId ? `${escapedName} ( <@${linkedId}> )` : escapedName;
        })
        .join(", ");

      container
        .addTextDisplayComponents((t) =>
          t.setContent(
            `**<:${grade}:${config.grade[grade].emoji}> ${members.length > 1 ? config.grade[grade].nom.pluriel : config.grade[grade].nom.normal} (${members.length}):**`,
          ),
        )
        .addTextDisplayComponents((t) =>
          t.setContent(memberNames || "Aucun staff ne possède ce grade"),
        )
        .addSeparatorComponents((s) => s);
    }

    const [configRoutine, configJail] = await Promise.all([
      Configuration.findOne({
        serveur,
        guildId: interaction.guild.id,
        categorie: "Routine",
        systeme: "Routine",
      }),
      Configuration.findOne({
        serveur,
        guildId: interaction.guild.id,
        categorie: "Jail",
        systeme: "Jail",
      }),
    ]);

    const options = [
      {
        label: "Liste des Staffs",
        value: "globalstaff_liste",
        default: true,
        emoji: "1441495206229835979",
      },
      {
        label: "Activité en Jeu",
        value: "globalstaff_activitejeu",
        default: false,
        emoji: "1441495207932596234",
      },
      {
        label: "Activité Vocal sur Discord",
        value: "globalstaff_activitediscord",
        default: false,
        emoji: "1441495208951808203",
      },
      {
        label: "Traitement des Attentes Staffs",
        value: "globalstaff_traitement",
        default: false,
        emoji: "1441495210206036141",
      },
    ];

    if (configJail) {
      options.push({
        label: "Jail",
        value: "globalstaff_jail",
        default: false,
        emoji: "1441734907260043264",
      });
    }

    if (configRoutine) {
      options.push({
        label: "Routine",
        value: "globalstaff_routine",
        default: false,
        emoji: "1441734905980649695",
      });
    }

    container.addActionRowComponents((row) =>
      row.setComponents(
        new StringSelectMenuBuilder()
          .setCustomId("globalstaff")
          .setPlaceholder("Choisit une option")
          .setOptions(options),
      ),
    );

    return interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] },
    });
  },
};
