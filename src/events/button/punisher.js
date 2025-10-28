const { ensureSanctions } = require("../../../util/punisher");
const { getPunisherContainer } = require("../../../util/container/punisher");

module.exports = {
  data: {
    name: "punisher",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const [type, direction, joueur, pageStr, serveur] =
      interaction.customId.split("-");
    if (type !== "punisher") return;

    let page = parseInt(pageStr, 10);
    if (direction === "next") page++;
    if (direction === "prev") page--;

    const neededCount = page * 7;
    await interaction.deferUpdate();

    const serveursCibles = serveur === "all" ? config.liste_serveur : [serveur];

    const sanctions = await ensureSanctions(
      joueur,
      neededCount,
      config,
      serveursCibles,
    );
    const maxPage = Math.max(1, Math.ceil(sanctions.length / 7));

    const embedColor = interaction.message.embeds[0]?.color;
    const { embed, row } = getPunisherContainer(
      joueur,
      sanctions,
      page,
      maxPage,
      embedColor,
      config,
      7,
      serveur,
    );

    return interaction.editReply({
      embeds: [embed],
      components: [row],
    });
  },
};
