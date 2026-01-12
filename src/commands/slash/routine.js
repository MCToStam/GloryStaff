const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
} = require("discord.js");
const { getData } = require("../../../util/module/getAndSaveData");
const { discordStaff } = require("../../../util/module/discordLink");
const { getEmojiTete } = require("../../../util/module/emoji");
const proxyCommande = require("../../../util/proxy/proxyCommande");

module.exports = {
  guild: true,
  data: new SlashCommandBuilder()
    .setName("routine")
    .setDescription("Effectue une routine"),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur } = interaction.parametre;

    const configRoutine = getData(`data/${serveur}/config-routine.json`);

    if (!configRoutine.routine?.active) {
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

    if (
      !configRoutine.routine?.Salon.valeur ||
      !configRoutine.routine?.Grade.valeur
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

    const roleAutorise = configRoutine.routine.Grade.valeur;

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

    const teteEmoji = await getEmojiTete(client, pseudonym);

    const routineContainer = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `## ${teteEmoji || "⏱️"} Routine de ${pseudonym.replace(/_/g, "\\_")}`,
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `**Début de la routine :** <t:${Math.floor(
            Date.now() / 1000,
          )}:R>\n**Infractions :**\n**Fin de la routine :**`,
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("routine")
            .setPlaceholder("Sélectionnez une infraction")
            .addOptions([
              {
                label: "Bunker Illégal",
                value: "routine_bunkerillegal",
                emoji: "1333876277651705878",
              },
              {
                label: "Anti-AFK",
                value: "routine_antiafk",
                emoji: "1333876277651705878",
              },
              {
                label: "Auto-Clic",
                value: "routine_autoclic",
                emoji: "1333876277651705878",
              },
              {
                label: "Stack Item",
                value: "routine_stackitem",
                emoji: "1333876277651705878",
              },
              {
                label: "AutoNuke Illégal",
                value: "routine_autonukeillegal",
                emoji: "1333876277651705878",
              },
              {
                label: "XRay",
                value: "routine_xray",
                emoji: "1333876277651705878",
              },
              {
                label: "Autre",
                value: "routine_autre",
                emoji: "1333876277651705878",
              },
            ]),
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`routine_finish-${pseudonym}`)
            .setLabel("✅ Terminer la Routine")
            .setStyle(ButtonStyle.Success),
        ),
      );

    if (interaction.isMessageComponent()) {
      return interaction.update({
        components: [routineContainer],
        flags: MessageFlags.IsComponentsV2,
      });
    } else {
      return interaction.reply({
        components: [routineContainer],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  },
};
