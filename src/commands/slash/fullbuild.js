const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
  ChannelType,
} = require("discord.js");
const { discordLink } = require("../../../util/module/discordLink");
const { FullBuild } = require("../../../util/container/module");
const proxyCommande = require("../../../util/proxy/proxyCommande");
const Configuration = require("../../../util/database/models/Configuration");

module.exports = {
  guild: true,
  config: { permission: "super_moderateur" },
  data: new SlashCommandBuilder()
    .setContexts(0)
    .setName("fullbuild")
    .setDescription("Valide un fullbuild")
    .addStringOption((option) =>
      option
        .setName("paysa")
        .setDescription("Pays pour lequel le fullbuild est validé")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("paysb")
        .setDescription("Pays pour lequel le pays-a va s'étendre")
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur, paysa, paysb } = interaction.parametre;

    const configExpansion = await Configuration.findOne({
      serveur,
      guildId: interaction.guild.id,
      categorie: "Expansion Territoriale",
      systeme: "Full Build",
    });

    if (!configExpansion.active) {
      const errorContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((t) =>
          t.setContent("## ❌ Système Désactivé"),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `Le système de Full Build est désactivé sur le serveur ${
              config.serveur[serveur].emoji_formate
            } ${serveur.charAt(0).toUpperCase() + serveur.slice(1)} pour votre serveur Discord.`,
          ),
        );

      if (interaction.isMessageComponent()) {
        const sentMessage = await interaction.update({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
          withResponse: true,
        });

        setTimeout(async () => {
          try {
            if (sentMessage.resource) {
              await sentMessage.resource.message.delete();
            } else {
              await sentMessage.delete();
            }
          } catch (error) {}
        }, 5_000);
      } else {
        return interaction.reply({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
    }

    if (!configExpansion.data.get("Salon")) {
      const errorContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((t) =>
          t.setContent("## ❌ Configuration Invalide"),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `Le système de Full Build n'est pas correctement configuré sur le serveur ${
              config.serveur[serveur].emoji_formate
            } ${
              serveur.charAt(0).toUpperCase() + serveur.slice(1)
            } pour votre serveur Discord, le choix du salon est manquant.`,
          ),
        );

      if (interaction.isMessageComponent()) {
        const sentMessage = await interaction.update({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
          withResponse: true,
        });

        setTimeout(async () => {
          try {
            if (sentMessage.resource) {
              await sentMessage.resource.message.delete();
            } else {
              await sentMessage.delete();
            }
          } catch (error) {}
        }, 5_000);
      } else {
        return interaction.reply({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
    }

    if (interaction.isMessageComponent()) {
      await interaction.deferUpdate();
    } else {
      await interaction.deferReply();
    }

    const pseudo = await discordLink(interaction.user.id);

    const { components } = await FullBuild(
      client,
      serveur,
      pseudo,
      paysa,
      paysb,
    );

    const salon = await client.channels.fetch(
      configExpansion.data.get("Salon"),
    );

    let message;
    if (configExpansion.data.get("Role").length > 0) {
      const roleMentions = configExpansion.data
        .get("Role")
        .map((roleId) => `<@&${roleId}>`)
        .join(", ");

      const roleTextDisplay = new TextDisplayBuilder().setContent(roleMentions);
      message = await salon.send({
        components: [roleTextDisplay, ...components],
        flags: MessageFlags.IsComponentsV2,
      });
    } else {
      message = await salon.send({
        components,
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const messageLink = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;

    const userContainer = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((t) => t.setContent("## 🏚️ FullBuild"))
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `Le fullbuild est correctement validé et a été envoyé ici : ${messageLink}`,
        ),
      );

    const sentMessage = await interaction.editReply({
      components: [userContainer],
      flags: MessageFlags.IsComponentsV2,
      withResponse: true,
    });

    setTimeout(async () => {
      try {
        if (sentMessage.resource) {
          await sentMessage.resource.message.delete();
        } else {
          await sentMessage.delete();
        }
      } catch (error) {}
    }, 5_000);

    if (salon.type === ChannelType.GuildNews) await message.crosspost();
  },
};
