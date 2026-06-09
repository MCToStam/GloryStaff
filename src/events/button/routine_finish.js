const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
} = require("discord.js");
const { getData, saveData } = require("../../../util/module/getAndSaveData");
const { getServeur } = require("../../../util/module/getServeur");
const { getEmojiTete } = require("../../../util/module/emoji");
const { guild } = require("../../commands/slash/fullbuild");
const Configuration = require("../../../util/database/models/Configuration");

module.exports = {
  data: {
    name: "routine_finish",
  },

  async execute(client, interaction, config) {
    const pseudo = interaction.customId.split("-")[1];
    const container = interaction.message.components[0];
    const description = container.components[2].data.content || "";

    const debutRoutineMatch = description.match(
      /\*\*Début de la routine :\*\* <t:(\d+):R>/,
    );
    const debutRoutine = debutRoutineMatch
      ? parseInt(debutRoutineMatch[1])
      : null;

    const serveur = await getServeur(interaction);

    const configRoutine = await Configuration.findOne({
      serveur,
      guildId: interaction.guild.id,
      categorie: "Routine",
      systeme: "Routine",
    });

    const guildId = interaction.guild.id;

    if (configRoutine.active && configRoutine.data.get("Salon")) {
      const salon = await interaction.client.channels.fetch(
        configRoutine.data.get("Salon"),
      );
      const roleMention = configRoutine.data.get("Role");

      let infractionsText = description.replace(
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

      const teteEmoji = (await getEmojiTete(client, pseudo)) || "⏱️";
      const routineContainer = new ContainerBuilder()
        .setAccentColor(config.serveur[serveur].couleur)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            `## ${teteEmoji} Routine de ${pseudo.replace(/_/g, "\\_")}`,
          ),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            description.replace(
              "**Fin de la routine :**",
              `**Fin de la routine :** <t:${Math.floor(Date.now() / 1000)}:R>`,
            ),
          ),
        );

      if (
        Array.isArray(roleMention) &&
        roleMention.length > 0 &&
        hasInfractions
      ) {
        const roleMentions = roleMention
          .map((roleId) => `<@&${roleId}>`)
          .join(", ");

        const roleTextDisplay = new TextDisplayBuilder().setContent(
          roleMentions,
        );

        await salon.send({
          components: [roleTextDisplay, routineContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      } else {
        await salon.send({
          components: [routineContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      }
    }

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
    await interaction.message.delete();
  },
};
