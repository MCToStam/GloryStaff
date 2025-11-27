const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getData, saveData } = require("../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "routine_finish",
  },

  async execute(client, interaction, config) {
    const message = interaction.message;
    const embed = message.embeds[0];

    if (embed) {
      const updatedEmbed = new EmbedBuilder(embed).setDescription(
        embed.description.replace(
          "**Fin de la routine :**",
          `**Fin de la routine :** <t:${Math.floor(Date.now() / 1000)}:R>`,
        ),
      );

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("routine")
        .setPlaceholder("Sélectionnez une infraction")
        .setDisabled(true)
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
        ]);

      const buttonFinish = new ButtonBuilder()
        .setCustomId("routine_finish")
        .setLabel("Terminer la Routine")
        .setStyle(ButtonStyle.Success)
        .setDisabled(true);

      const actionRow1 = new ActionRowBuilder().addComponents(selectMenu);
      const actionRow2 = new ActionRowBuilder().addComponents(buttonFinish);

      await interaction.update({
        embeds: [updatedEmbed],
        files: [],
        components: [actionRow1, actionRow2],
        ephemeral: true,
      });

      const embedColor = interaction.message.embeds[0]?.color;

      const serveur = Object.keys(config.couleur).find(
        (key) => config.couleur[key] === embedColor,
      );

      const configRoutine = getData(`data/${serveur}/config-routine.json`);

      if (
        configRoutine.routine?.active &&
        configRoutine.routine?.Salon.valeur
      ) {
        const salon = await interaction.client.channels.fetch(
          configRoutine.routine?.Salon.valeur,
        );
        const roleMention = configRoutine.routine?.Role;

        let infractionsText = embed.description.replace(
          /\*\*Début de la routine :\*\* <t:\d+:R>\n/,
          "",
        );
        infractionsText = infractionsText
          .split("**Infractions :**\n")[1]
          ?.split("\n**Fin de la routine :**")[0]
          ?.trim();

        const hasInfractions =
          infractionsText &&
          infractionsText.length > 0 &&
          infractionsText !== "**Fin de la routine :**";

        if (
          Array.isArray(roleMention) &&
          roleMention.length > 0 &&
          hasInfractions
        ) {
          await salon.send({
            embeds: [updatedEmbed],
            content: roleMention.map((id) => `<@&${id}>`).join(" "),
          });
        } else {
          await salon.send({ embeds: [updatedEmbed] });
        }
      }

      const pseudo = embed.title.split(" - ")[1];
      const debutRoutineMatch = embed.description.match(
        /\*\*Début de la routine :\*\* <t:(\d+):R>/,
      );
      const debutRoutine = debutRoutineMatch
        ? parseInt(debutRoutineMatch[1])
        : null;

      let routineData = {};

      routineData = getData(`data/${serveur}/routine.json`);

      if (!routineData[pseudo]) {
        routineData[pseudo] = {
          derniere_routine: debutRoutine,
          routine: [],
        };
      }

      routineData[pseudo].derniere_routine = debutRoutine;
      routineData[pseudo].routine.push(debutRoutine);

      saveData(`data/${serveur}/routine.json`, routineData);
    }
  },
};
