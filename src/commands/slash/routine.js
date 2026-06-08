const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
} = require("discord.js");
const { discordStaff } = require("../../../util/module/discordLink");
const { Routine } = require("../../../util/container/module");
const proxyCommande = require("../../../util/proxy/proxyCommande");
const Configuration = require("../../../util/database/models/Configuration");

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
    const guildId = interaction.guild.id;

    const configRoutine = await Configuration.findOne({
      serveur,
      guildId,
      categorie: "Routine",
      systeme: "Routine",
    });

    if (!configRoutine || !configRoutine.active) {
      const errorContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((t) =>
          t.setContent("## ❌ Système Désactivé"),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `Le système de Routine est désactivé sur le serveur ${
              config.emoji_formate[serveur]
            } ${serveur}.`,
          ),
        );

      return interaction.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const salonId = configRoutine.data.get("Salon");
    const grade = configRoutine.data.get("Grade");

    if (!salonId || !grade) {
      const errorContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((t) =>
          t.setContent("## ❌ Configuration Invalide"),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `Le système de Routine n'est pas correctement configuré sur ${
              config.emoji_formate[serveur]
            } ${serveur}.`,
          ),
        );

      return interaction.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const gradeAutoriseMap = {
      Administrateur: "administrateur",
      "Super-Modérateur": "super_moderateur",
      "Modérateur Plus": "moderateur_plus",
      Modérateur: "moderateur",
      "Modérateur Test": "moderateur_test",
      Guide: "guide",
    };

    const roleAutorise = gradeAutoriseMap[grade];

    const { pseudonym, container } = await discordStaff(
      interaction.user.id,
      serveur,
      roleAutorise,
    );

    if (container) {
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const { components } = await Routine(client, serveur, pseudonym);

    if (interaction.isMessageComponent()) {
      return interaction.update({
        components,
        flags: MessageFlags.IsComponentsV2,
      });
    }

    return interaction.reply({
      components,
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
