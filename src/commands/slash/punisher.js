const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const { serveurs } = require("../../../util/option-serveur.js");
const { ensureSanctions } = require("../../../util/punisher");
const { getPunisherContainer } = require("../../../util/container/punisher");
const { getData } = require("../../../util/module/getAndSaveData.js");

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
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Le type de configuration à afficher")
        .setRequired(true)
        .addChoices({ name: "Inter-Serveur", value: "all" }, ...serveurs),
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

    if (serveur === "non-lie") {
      const erreurEmbed = new EmbedBuilder()
        .setTitle("Erreur")
        .setColor(config.errorcolor)
        .setDescription(
          'Votre compte Discord n\'est pas reconnu, il vous faut être renseigné pour utiliser cette commande. Pour ce faire, il te suffit de te connecter à notre panel de contrôle. Une fois connecté avec ton compte Discord, va dans la partie "Profil" puis tu as un bouton afin de lier ton compte NationsGlory.',
        )
        .setFooter({ text: config.footer });

      const panelButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("💻 Accéder au panel")
          .setStyle(ButtonStyle.Link)
          .setURL("https://glorybot.fr"),
      );

      return interaction.reply({
        embeds: [erreurEmbed],
        components: [panelButton],
        ephemeral: true,
      });
    }

    if (serveur !== "all" && !config.liste_serveur.includes(serveur)) {
      const unknownServerEmbed = {
        title: "Erreur",
        description: `Le serveur **${serveur}** n'est pas un serveur reconnu. Veuillez fournir un serveur valide.`,
        color: config.errorcolor,
        footer: { text: config.footer },
      };
      return interaction.reply({
        embeds: [unknownServerEmbed],
        ephemeral: true,
      });
    }

    const capitalizedServeur =
      serveur.charAt(0).toUpperCase() + serveur.slice(1);
    const emojiId = config.emoji[serveur.toLowerCase()];

    if (serveur === "permission") {
      const permissionEmbed = {
        title: "Erreur",
        description: `Tu n'as pas la permission d'effectuer cette commande pour le serveur <:NG${capitalizedServeur}:${emojiId}> **${capitalizedServeur}** !`,
        color: config.errorcolor,
        footer: { text: config.footer },
      };
      return interaction.reply({ embeds: [permissionEmbed], ephemeral: true });
    }

    let staffData = {};

    if (serveur === "all") {
      for (const srv of config.liste_serveur) {
        const filePath = path.join(__dirname, "data", srv, "staff.json");
        if (fs.existsSync(filePath)) {
          const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
          for (const rank in data) {
            if (!staffData[rank]) staffData[rank] = [];
            staffData[rank] = [...new Set([...staffData[rank], ...data[rank]])];
          }
        }
      }
    } else {
      const staffFilePath = path.join(__dirname, "data", serveur, "staff.json");
      if (fs.existsSync(staffFilePath)) {
        staffData = JSON.parse(fs.readFileSync(staffFilePath, "utf8"));
      } else {
        fs.mkdirSync(path.join(__dirname, "data", serveur), {
          recursive: true,
        });
        staffData = {};
      }
    }

    const pseudo = interaction.options.getString("joueur");

    await interaction.deferReply({ ephemeral: true });

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

    const { embed, row } = getPunisherContainer(
      joueur,
      sanctions,
      1,
      maxPage,
      config.couleur[serveur] || config.color,
      config,
      7,
      serveur,
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  },
};
