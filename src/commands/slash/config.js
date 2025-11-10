const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { getData } = require("../../../util/module/getAndSaveData");
const { containerSingle } = require("../../../util/container/configSingle");
const { containerMultiple } = require("../../../util/container/configMultiple");
const {
  errorStaffContainer,
  discordStaff,
} = require("../../../util/module/discordLink");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Affiche la configuration d’un système")
    .addStringOption((option) =>
      option
        .setName("serveur")
        .setDescription("Le serveur pour lequel afficher la configuration")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Le type de configuration à afficher")
        .setRequired(true)
        .addChoices(
          { name: "Attente Staff", value: "attentestaff" },
          { name: "Candidature", value: "candidature" },
          { name: "Disband", value: "disband" },
          { name: "Double Lead", value: "doublelead" },
          { name: "Expansion Territoriale", value: "expansionterritoriale" },
          { name: "Forum", value: "forum" },
          { name: "Jail", value: "jail" },
          { name: "Notation", value: "notation" },
          { name: "ONU", value: "onu" },
          { name: "NGRadio", value: "radio" },
          { name: "Récapitulatif", value: "recap" },
          { name: "Routine", value: "routine" },
          { name: "Staff", value: "staff" },
        ),
    ),

  async execute(client, interaction, config) {
    const serveur = interaction.options.getString("serveur").toLowerCase();

    /*const { errorContainer } = await errorStaffContainer(serveur);

    if (errorContainer) {
      return interaction.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const { pseudonym, servers, container } = await discordStaff(
      interaction.user.id,
      serveur,
    );

    if (container) {
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }*/

    const type = interaction.options.getString("type").toLowerCase();

    const typeMap = {
      attentestaff: "Attente Staff",
      candidature: "Candidature",
      disband: "Disband",
      doublelead: "Double Lead",
      expansionterritoriale: "Expansion Territoriale",
      forum: "Forum",
      jail: "Jail",
      notation: "Notation",
      onu: "ONU",
      radio: "NGRadio",
      recap: "Récapitulatif",
      routine: "Routine",
      staff: "Staff",
    };

    const configData = getData(`data/${serveur}/config-${type}.json`);
    const keys = Object.keys(configData);

    if (keys.length === 1) {
      const systemName = keys[0];
      const settings = configData[systemName];
      const container = await containerSingle(
        serveur,
        systemName,
        settings,
        type,
      );

      await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } else {
      const container = await containerMultiple(serveur, type, configData);
      await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  },
};
