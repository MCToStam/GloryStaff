const {
  StringSelectMenuBuilder,
  MessageFlags,
  ContainerBuilder,
} = require("discord.js");
const { getData } = require("../../../../../util/module/getAndSaveData");
const { getServeur } = require("../../../../../util/module/getServeur");
const { discordLink } = require("../../../../../util/module/discordLink");
const Configuration = require("../../../../../util/database/models/Configuration");

module.exports = {
  data: {
    name: "globalstaff_liste",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);
    const linkData = (await discordLink(false))?.data;
    const fullStaffData = getData(`data/${serveur}/staff-serveur.json`);

    const container = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((t) =>
        t.setContent("## <:liste:1441495206229835979> Liste des Staffs"),
      )
      .addSeparatorComponents((s) => s);

    const gradeMap = {
      Administrateur: { plural: "Administrateurs", normal: "Administrateur" },
      "Super-Modérateur": {
        plural: "Super Modérateurs",
        normal: "Super Modérateur",
      },
      "Modérateur Plus": {
        plural: "Modérateurs Plus",
        normal: "Modérateur Plus",
      },
      Modérateur: { plural: "Modérateurs", normal: "Modérateur" },
      "Modérateur Test": {
        plural: "Modérateur Tests",
        normal: "Modérateur Test",
      },
      Guide: { plural: "Guides", normal: "Guide" },
    };

    for (const [grade, members] of Object.entries(fullStaffData)) {
      if (members.length > 0) {
        const emoji = config.emojigrade[grade] || "";
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
              `**${emoji} ${members.length > 1 ? gradeMap[grade].plural : gradeMap[grade].normal} (${members.length}):**`,
            ),
          )
          .addTextDisplayComponents((t) =>
            t.setContent(memberNames || "Aucun staff ne possède ce grade"),
          )
          .addSeparatorComponents((s) => s);
      }
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
