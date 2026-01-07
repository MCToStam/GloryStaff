const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ContainerBuilder,
} = require("discord.js");
const { getData, saveData } = require("../../../util/module/getAndSaveData");
const { discordStaff } = require("../../../util/module/discordLink");
const { getEmojiTete } = require("../../../util/module/emoji");
const proxyCommande = require("../../../util/proxy/proxyCommande");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("jail")
    .setDescription("Effectue un jail")
    .addStringOption((option) =>
      option
        .setName("criminel")
        .setDescription("Joueur qui doit subir le jail")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("durée")
        .setDescription("Durée du jail (ex: 1h, 30m)")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("lien_raison")
        .setDescription("Lien ou raison du jail")
        .setRequired(true),
    ),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur, criminel, durée, lien_raison } = interaction.parametre;

    const isLienValide = lien_raison.startsWith(
      "https://nationsglory.fr/forums/thread/",
    );

    const dureeRegex = /^(\d+)([hmdb])$/;
    const match = durée.match(dureeRegex);

    if (!match) {
      const errorContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent("## ❌ Durée Invalide"),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            "La durée doit être au format suivant :\n`1h` (1 heure), `30m` (30 minutes), `2d` (2 jours), etc.\n Elle peut aussi être du format `100b` dans le cas d'un jailblock.",
          ),
        );

      if (interaction.isMessageComponent()) {
        return interaction.update({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      } else {
        return interaction.reply({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      }
    }

    const quantite = parseInt(match[1]);
    const unite = match[2];

    let dureeLisible = "";

    switch (unite) {
      case "h":
        dureeLisible = quantite === 1 ? "1 heure" : `${quantite} heures`;
        break;
      case "m":
        dureeLisible = quantite === 1 ? "1 minute" : `${quantite} minutes`;
        break;
      case "d":
        dureeLisible = quantite === 1 ? "1 jour" : `${quantite} jours`;
        break;
      case "b":
        dureeLisible = quantite === 1 ? "1 bloc" : `${quantite} blocs`;
        break;
    }

    const searchRes = await fetch(
      `https://apiv2.nationsglory.fr/forums/userSearch?search=${criminel}`,
    );
    const similarUsers = await searchRes.json();

    const foundUser = similarUsers.find(
      (user) => user.username.toLowerCase() === criminel.toLowerCase(),
    );

    if (!foundUser) {
      let suggestions = similarUsers
        .map((user) => `- ${user.username.replace(/_/g, "\\_")}`)
        .join("\n");

      const errorContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent("## ❌ Criminel Invalide"),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            similarUsers.length === 0
              ? "L'utilisateur que vous recherchez n'existe pas."
              : `L'utilisateur que vous recherchez n'existe pas, il s'agit peut-être de\n\n${suggestions}`,
          ),
        );

      if (interaction.isMessageComponent()) {
        return interaction.update({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      } else {
        return interaction.reply({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      }
    }

    const vraiCriminel = foundUser.username;

    const configJail = getData(`data/${serveur}/config-jail.json`);

    if (!configJail.jail?.active) {
      const errorContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent("## ❌ Système Désactivé"),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            `Le système de Jail est désactivé sur le serveur ${
              config.emoji_formate[serveur]
            } ${serveur.charAt(0).toUpperCase() + serveur.slice(1)}.`,
          ),
        );

      if (interaction.isMessageComponent()) {
        return interaction.update({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      } else {
        return interaction.reply({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      }
    }

    if (!configJail.jail?.Salon.valeur || !configJail.jail?.Grade.valeur) {
      const errorContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent("## ❌ Configuration Invalide"),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            `Le système de Jail n'est pas correctement configuré sur le serveur ${
              config.emoji_formate[serveur]
            } ${
              serveur.charAt(0).toUpperCase() + serveur.slice(1)
            }, le choix du salon et/ou du grade autorisé est manquant.`,
          ),
        );

      if (interaction.isMessageComponent()) {
        return interaction.update({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      } else {
        return interaction.reply({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      }
    }

    const roleAutorise = configJail.jail.Grade.valeur;

    const gradeAutorise = {
      Administrateur: "administrateur",
      "Super-Modérateur": "super_moderateur",
      "Modérateur Plus": "moderateur_plus",
      Modérateur: "moderateur",
      "Modérateur Test": "moderateur_test",
      Guide: "guide",
    };

    const { container } = await discordStaff(
      interaction.user.id,
      serveur,
      gradeAutorise[roleAutorise],
    );

    if (container) {
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    let descriptionEmbed = `**Durée** : ${dureeLisible}\n`;
    descriptionEmbed += isLienValide
      ? `**Lien de la plainte :** [Clic Ici](${lien_raison})`
      : `**Raison :** ${lien_raison}`;

    const salon = await interaction.client.channels.fetch(
      configJail.jail?.Salon.valeur,
    );

    const teteEmoji = await getEmojiTete(client, vraiCriminel);

    const jailContainer = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `## ${teteEmoji || "🚧"} Jail sur ${vraiCriminel.replace(
            /_/g,
            "\\_",
          )}`,
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(descriptionEmbed),
      )
      .addSeparatorComponents((separator) => separator)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("jail_finish")
            .setLabel("✅ Jail Effectué")
            .setStyle(ButtonStyle.Success),
          ...(isLienValide
            ? [
                new ButtonBuilder()
                  .setLabel("🔗 Aller sur la plainte")
                  .setStyle(ButtonStyle.Link)
                  .setURL(lien_raison),
              ]
            : []),
        ),
      );

    const message = await salon.send({
      components: [jailContainer],
      flags: MessageFlags.IsComponentsV2,
    });

    const thread = await message.startThread({
      name: `Connexion de ${vraiCriminel}`,
      autoArchiveDuration: 4320,
      reason: `Fil automatique pour les connexions de ${vraiCriminel}`,
    });

    const introContainer = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `## 🔎 Connexion de ${vraiCriminel.replace(/_/g, "\\_")}`,
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          "Vous serez avertis dès lors que le joueur se connectera dans ce fil.",
        ),
      );

    await thread.send({
      components: [introContainer],
      flags: MessageFlags.IsComponentsV2,
    });

    let jailData = getData(`data/${serveur}/jail.json`);

    if (!jailData[vraiCriminel]) {
      jailData[vraiCriminel] = [];
    }

    jailData[vraiCriminel].push({
      duree: dureeLisible,
      lien: lien_raison,
      messageId: message.id,
      threadId: thread.id,
      channelId: message.channelId,
      connecte: false,
      jailed: false,
    });

    saveData(`data/${serveur}/jail.json`, jailData);

    const messageLink = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;

    const userContainer = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## 🚧 Jail"),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `Le jail a correctement été envoyé ici : ${messageLink}`,
        ),
      );

    if (interaction.isMessageComponent()) {
      return interaction.update({
        components: [userContainer],
        flags: MessageFlags.IsComponentsV2,
      });
    } else {
      return interaction.reply({
        components: [userContainer],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  },
};
