const { ensureSanctions } = require("../../../../util/punisher");
const { getPunisherContainer } = require("../../../../util/container/punisher");
const { MessageFlags } = require("discord.js");

module.exports = {
  data: {
    name: "candidature_punisher",
  },

  async execute(client, interaction, config) {
    const serveur = "all";
    const joueur = interaction.customId.split("-")[1];

    await interaction.deferReply({});

    const serveursCibles = serveur !== "all" ? [serveur] : config.liste_serveur;

    const sanctions = await ensureSanctions(joueur, 7, config, serveursCibles);
    const maxPage = Math.max(1, Math.ceil(sanctions.length / 7));

    const sanctionContainer = await getPunisherContainer(
      joueur,
      sanctions,
      1,
      maxPage,
      config.couleur[serveur] || undefined,
      config,
      7,
      serveur,
      client,
    );

    await interaction.editReply({
      components: [sanctionContainer],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
