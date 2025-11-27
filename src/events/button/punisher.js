const { ensureSanctions } = require("../../../util/punisher");
const { getPunisherContainer } = require("../../../util/container/punisher");
const { MessageFlags } = require("discord.js");

module.exports = {
  data: {
    name: "punisher",
  },

  async execute(client, interaction, config) {
    const [type, direction, joueur, pageStr, serveur] =
      interaction.customId.split("-");
    if (type !== "punisher") return;

    let page = parseInt(pageStr, 10);
    if (direction === "next") page++;
    if (direction === "prev") page--;

    const neededCount = page * 7;
    await interaction.deferUpdate({});

    const serveursCibles = serveur === "all" ? config.liste_serveur : [serveur];

    const sanctions = await ensureSanctions(
      joueur,
      neededCount,
      config,
      serveursCibles,
    );
    const maxPage = Math.max(1, Math.ceil(sanctions.length / 7));

    const sanctionContainer = await getPunisherContainer(
      joueur,
      sanctions,
      page,
      maxPage,
      config.couleur[serveur],
      config,
      7,
      serveur,
      client,
    );

    return interaction.editReply({
      components: [sanctionContainer],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
