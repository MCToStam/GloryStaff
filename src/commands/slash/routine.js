const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
} = require("discord.js");
const { getData } = require("../../../util/module/getAndSaveData");
const { discordStaff } = require("../../../util/module/discordLink");
const { Routine } = require("../../../util/container/module");
const proxyCommande = require("../../../util/proxy/proxyCommande");

module.exports = {
  guild: true,
  data: new SlashCommandBuilder()
    .setContexts(0)
    .setName("routine")
    .setDescription("Effectue une routine"),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur } = interaction.parametre;

    const dataFile = getData(`data/${serveur}/config.json`);
    const configData = dataFile.find((c) => c.nom === "Routine");
    const configRoutine = configData.systeme.Routine;

    const guildId = interaction.guild.id;

    if (!configRoutine.active[guildId]) {
      const errorContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent("## ❌ Système Désactivé"),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            `Le système de Routine est désactivé sur le serveur ${
              config.emoji_formate[serveur]
            } ${serveur.charAt(0).toUpperCase() + serveur.slice(1)} pour votre serveur Discord.`,
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

    if (
      !configRoutine.Salon.valeur[guildId] ||
      !configRoutine.Grade.valeur[guildId]
    ) {
      const errorContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent("## ❌ Configuration Invalide"),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            `Le système de Routine n'est pas correctement configuré sur le serveur ${
              config.emoji_formate[serveur]
            } ${
              serveur.charAt(0).toUpperCase() + serveur.slice(1)
            } pour votre serveur Discord, le choix du salon et/ou du grade autorisé est manquant.`,
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

    const roleAutorise = configRoutine.Grade.valeur[guildId];

    const gradeAutorise = {
      Administrateur: "administrateur",
      "Super-Modérateur": "super_moderateur",
      "Modérateur Plus": "moderateur_plus",
      Modérateur: "moderateur",
      "Modérateur Test": "moderateur_test",
      Guide: "guide",
    };

    const { pseudonym, container } = await discordStaff(
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

    const routineContainer = await Routine(client, serveur, pseudonym);

    if (interaction.isMessageComponent()) {
      return interaction.update({
        components: routineContainer,
        flags: MessageFlags.IsComponentsV2,
      });
    } else {
      return interaction.reply({
        components: routineContainer,
        flags: MessageFlags.IsComponentsV2,
      });
    }
  },
};
