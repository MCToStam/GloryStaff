const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
} = require("discord.js");
const { discordStaff } = require("../../../util/module/discordLink");
const { Routine } = require("../../../util/container/module");
const proxyCommande = require("../../../util/proxy/proxyCommande");
const Configuration = require("../../../util/database/models/Configuration");
const {
  getCachedEmojiTete,
  getEmojiTete,
} = require("../../../util/module/emoji");
const {
  editReplyIfCurrent,
  trackInteractionMessage,
} = require("../../../util/module/interactionMessageState");

module.exports = {
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
              config.serveur[serveur].emoji_formate
            } ${serveur}.`,
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
        return;
      } else {
        return interaction.reply({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
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
              config.serveur[serveur].emoji_formate
            } ${serveur}.`,
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
        return;
      } else {
        return interaction.reply({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
    }

    const { pseudonym, container } = await discordStaff(
      interaction.user.id,
      serveur,
      grade,
    );

    if (container) {
      if (interaction.isMessageComponent()) {
        const sentMessage = await interaction.update({
          components: [container],
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
        return;
      } else {
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
    }

    const cachedEmoji = getCachedEmojiTete(
      pseudonym,
      "<:tete_default:1517896405841215619>",
    );
    const { components } = await Routine(
      client,
      serveur,
      pseudonym,
      cachedEmoji,
    );

    if (interaction.isMessageComponent()) {
      await interaction.update({
        components,
        flags: MessageFlags.IsComponentsV2,
        withResponse: true,
      });
    } else {
      await interaction.reply({
        components,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        withResponse: true,
      });
    }

    const tracker = await trackInteractionMessage(interaction);

    void (async () => {
      const emoji = await getEmojiTete(client, pseudonym);
      const { components: updatedComponents } = await Routine(
        client,
        serveur,
        pseudonym,
        emoji,
      );

      await editReplyIfCurrent(interaction, tracker, {
        components: updatedComponents,
        flags: MessageFlags.IsComponentsV2,
      });
    })();
  },
};
