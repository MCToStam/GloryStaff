const {
  StringSelectMenuBuilder,
  MessageFlags,
  ContainerBuilder,
} = require("discord.js");
const { getData } = require("../../../../../util/module/getAndSaveData");
const { getServeur } = require("../../../../../util/module/getServeur");
const { discordLink } = require("../../../../../util/module/discordLink");

module.exports = {
  data: {
    name: "globalstaff_liste",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);
    const linkData = (await discordLink(false))?.data;
    const fullStaffData = getData(`data/${serveur}/staff-serveur.json`);

    let fullStaffSection = "";
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
        fullStaffSection += `**${emoji} ${grade} :** ${memberNames}\n`;
      }
    }
    fullStaffSection =
      fullStaffSection ||
      "Aucune donnée trouvée dans le fichier staff-serveur.json.";

    const container = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur] || config.color)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## Liste des Staff - ${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }`,
        ),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) => t.setContent(fullStaffSection))
      .addSeparatorComponents((s) => s)
      .addActionRowComponents((row) =>
        row.setComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`globalstaff`)
            .setPlaceholder("Choisit une option")
            .setOptions([
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
            ]),
        ),
      );

    return interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] },
    });
  },
};
