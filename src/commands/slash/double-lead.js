const { getData } = require("../../../util/module/getAndSaveData");
const { getEmojiTete, getEmojiDrapeau } = require("../../../util/module/emoji");
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

    const { container } = await discordStaff(interaction.user.id, serveur);
    if (container) {
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const data = getData(`data/doublelead.json`);

    const matchingLeaders = data.filter((entry) =>
      entry.servers.some((s) => s.server.toLowerCase() === serveur),
    );

    if (matchingLeaders.length === 0) {
      const noDoubleLead = new ContainerBuilder()
        .setAccentColor(config.couleur[serveur])
        .addTextDisplayComponents((t) =>
          t.setContent(
            `## 🏴 Double Lead - ${
              serveur.charAt(0).toUpperCase() + serveur.slice(1)
            }`,
          ),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `Aucun double lead n'a été trouvé sur le serveur <:NG${
              serveur.charAt(0).toUpperCase() + serveur.slice(1)
            }:${config.emoji[serveur]}> **${
              serveur.charAt(0).toUpperCase() + serveur.slice(1)
            }**.`,
          ),
        );
      return await interaction.reply({
        components: [noDoubleLead],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    await interaction.deferReply({});

    const linesFinal = await Promise.all(
      matchingLeaders.map(async (entry) => {
        const pseudos = entry.leader.split("/");
        let lines = [];

        for (const pseudo of pseudos) {
          for (const s of entry.servers.filter(
            (srv) => srv.compte === pseudo,
          )) {
            const emojiTete = await getEmojiTete(client, pseudo);
            const emojiDrapeau = await getEmojiDrapeau(
              client,
              s.server,
              s.country,
            );

            lines.push(
              s.server.toLowerCase() === serveur
                ? `**${emojiTete} ${pseudo.replace(
                    /_/g,
                    "\\_",
                  )} ➜ ${emojiDrapeau} ${s.country} ${
                    s.server.charAt(0).toUpperCase() + s.server.slice(1)
                  }**`
                : `${emojiTete} ${pseudo.replace(
                    /_/g,
                    "\\_",
                  )} ➜ ${emojiDrapeau} ${s.country} ${
                    s.server.charAt(0).toUpperCase() + s.server.slice(1)
                  }`,
            );
          }
        }

        return lines.join("\n");
      }),
    );

    const containerDoubleLead = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## 🏴 Double Lead - ${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }`,
        ),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) => t.setContent(linesFinal.join("\n\n")));

    return await interaction.editReply({
      components: [containerDoubleLead],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
