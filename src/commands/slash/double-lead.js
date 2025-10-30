const { getData } = require("../../../util/module/getAndSaveData");
const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
} = require("discord.js");
const {
  errorStaffContainer,
  discordStaff,
} = require("../../../util/module/discordLink");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("double-lead")
    .setDescription("Affiche la liste des doubles lead")
    .addStringOption((option) =>
      option
        .setName("serveur")
        .setDescription(
          "Le serveur pour lequel afficher la liste des doubles lead",
        )
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async execute(client, interaction, config) {
    const serveur = interaction.options.getString("serveur").toLowerCase();

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
    );

    if (container) {
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const data = getData(`data/doublelead.json`);

    const matchingLeaders = data.filter((entry) =>
      Object.keys(entry.servers).some(
        (server) => server.toLowerCase() === serveur,
      ),
    );

    if (matchingLeaders.length === 0) {
      const noDoubleLead = new ContainerBuilder()
        .setAccentColor(config.couleur[serveur])
        .addTextDisplayComponents((t) =>
          t.setContent(
            `## Double Lead - ${
              serveur.charAt(0).toUpperCase() + serveur.slice(1)
            }`,
          ),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `Aucun double lead n'a été trouvé sur le serveur <:NG${
              serveur.charAt(0).toUpperCase() + serveur.slice(1)
            }:${config.emoji[serveur.toLowerCase()]}> **${
              serveur.charAt(0).toUpperCase() + serveur.slice(1)
            }**.`,
          ),
        );
      return await interaction.reply({
        components: [noDoubleLead],
        flags: MessageFlags.IsComponentsV2,
        ephemeral: true,
      });
    }

    const containerDoubleLead = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## Double Lead - ${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }`,
        ),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          matchingLeaders
            .map((entry) => {
              let serverList = "";
              Object.keys(entry.servers).forEach((serverName) => {
                const countryName = entry.servers[serverName];
                serverList += `↪ <:NG${
                  serverName.charAt(0).toUpperCase() + serverName.slice(1)
                }:${config.emoji[serverName]}> ${
                  serverName.charAt(0).toUpperCase() + serverName.slice(1)
                } : ${countryName}\n`;
              });
              return `**${entry.leader.replace(
                /_/g,
                "\\_",
              )} :**\n${serverList}`;
            })
            .join("\n"),
        ),
      );

    return await interaction.reply({
      components: [containerDoubleLead],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true,
    });
  },
};
