const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { serveurs } = require("../../../util/option-serveur.js");
const { ensureSanctions } = require("../../../util/punisher");
const { getPunisherContainer } = require("../../../util/container/punisher");
const {
  errorStaffContainer,
  discordStaff,
} = require("../../../util/module/discordLink");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("punisher")
    .setDescription("Affiche le punisher d'un joueur")
    .addStringOption((option) =>
      option
        .setName("serveur")
        .setDescription(
          "Le serveur pour lequel afficher la liste des doubles lead",
        )
        .setRequired(true)
        .addChoices({ name: "Inter-Serveur", value: "all" }, ...serveurs)
        .setAutocomplete(false),
    )
    .addStringOption((option) =>
      option
        .setName("joueur")
        .setDescription("Le joueur pour lequel afficher le punisher")
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
      "moderateur_test",
    );

    if (container) {
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const pseudo = interaction.options.getString("joueur");

    await interaction.deferReply({});

    const searchRes = await fetch(
      `https://apiv2.nationsglory.fr/forums/userSearch?search=${pseudo}`,
    );
    const similarUsers = await searchRes.json();

    const foundUser = similarUsers.find(
      (user) => user.username.toLowerCase() === pseudo.toLowerCase(),
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

    const joueur = foundUser.username;

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
