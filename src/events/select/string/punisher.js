const { ensureSanctions } = require("../../../../util/punisher");
const { getPunisherContainer } = require("../../../../util/container/punisher");

module.exports = {
  data: {
    name: "gestionstaff_punisher",
  },

  async execute(client, interaction, config) {
    const PER_PAGE = 7;
    const embedColor = interaction.message.embeds[0]?.color;
    const joueur = interaction.message.embeds[0]?.title
      ?.split("- ")[1]
      ?.trim()
      ?.replace(/\\/g, "");

    await interaction.deferReply({ ephemeral: true });

    const sanctions = await ensureSanctions(joueur, PER_PAGE, config);
    const maxPage = Math.max(1, Math.ceil(sanctions.length / PER_PAGE));
    const page = 1;

    const { embed, row } = getPunisherContainer(
      joueur,
      sanctions,
      page,
      maxPage,
      embedColor,
      config,
      PER_PAGE,
    );

    return interaction.editReply({
      embeds: [embed],
      components: [row],
    });
  },
};
