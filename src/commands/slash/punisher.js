const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { serveurs } = require("../../../util/option-serveur.js");
const { ensureSanctions } = require("../../../util/punisher");
const { getPunisherContainer } = require("../../../util/container/punisher");
const proxyCommande = require("../../../util/proxy/proxyCommande");

module.exports = {
  config: { permission: "moderateur_test" },
  data: new SlashCommandBuilder()
    .setName("punisher")
    .setDescription("Affiche le punisher d'un joueur")
    .addStringOption((option) =>
      option
        .setName("joueur")
        .setDescription("Le joueur pour lequel afficher le punisher")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("serveur")
        .setDescription("Le serveur pour lequel afficher la configuration")
        .addChoices({ name: "Inter-Serveur", value: "all" }, ...serveurs)
        .setRequired(false)
        .setAutocomplete(false),
    ),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur, joueur } = interaction.parametre;

    if (interaction.isMessageComponent()) {
      await interaction.deferUpdate();
    } else {
      await interaction.deferReply();
    }

    const searchRes = await fetch(
      `https://apiv2.nationsglory.fr/forums/userSearch?search=${joueur}`,
    );
    const similarUsers = await searchRes.json();

    const foundUser = similarUsers.find(
      (user) => user.username.toLowerCase() === joueur.toLowerCase(),
    );

    if (!foundUser) {
      let suggestions = similarUsers
        .map((user) => `- ${user.username.replace(/_/g, "\\_")}`)
        .join("\n");
      let description;

      if (similarUsers.length === 0) {
        description = "L'utilisateur que vous recherchez n'existe pas.";
      } else {
        description = `L'utilisateur que vous recherchez n'existe pas, il s'agit peut-être de\n\n${suggestions}`;
      }

      const errorembed = {
        author: { name: "Erreur" },
        footer: { text: config.footer },
        color: config.errorcolor,
        thumbnail: { url: `https://i.imgur.com/ZB0yLME.png` },
        description: description,
      };
      return interaction.editReply({ embeds: [errorembed], ephemeral: false });
    }

    const vraiJoueur = foundUser.username;

    const serveursCibles = serveur !== "all" ? [serveur] : config.liste_serveur;

    const sanctions = await ensureSanctions(
      vraiJoueur,
      7,
      config,
      serveursCibles,
    );
    const maxPage = Math.max(1, Math.ceil(sanctions.length / 7));

    const sanctionContainer = await getPunisherContainer(
      vraiJoueur,
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
