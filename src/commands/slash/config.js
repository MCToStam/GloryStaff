const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { getData } = require("../../../util/module/getAndSaveData");
const { containerSingle } = require("../../../util/container/configSingle");
const { containerMultiple } = require("../../../util/container/configMultiple");
const proxyCommande = require("../../../util/proxy/proxyCommande");

module.exports = {
  config: { permission: "super_moderateur" },
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Affiche la configuration d’un système")
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
          { name: "Joueur(s) Connecté(s)", value: "joueurconnecte" },
          { name: "Notation", value: "notation" },
          { name: "ONU", value: "onu" },
          { name: "Récapitulatif", value: "recap" },
          { name: "Routine", value: "routine" },
          { name: "Staff", value: "staff" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("serveur")
        .setDescription("Le serveur pour lequel afficher la configuration")
        .setRequired(false)
        .setAutocomplete(true),
    ),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur, type } = interaction.parametre;

    const configData = getData(`data/${serveur}/config-${type}.json`);
    const keys = Object.keys(configData);

    if (keys.length === 1) {
      const systemName = keys[0];
      const container = await containerSingle(
        serveur,
        systemName,
        configData,
        type,
      );
      if (interaction.isMessageComponent()) {
        return interaction.update({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      } else {
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }
    } else {
      const container = await containerMultiple(serveur, type, configData);
      if (interaction.isMessageComponent()) {
        return interaction.update({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      } else {
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }
    }
  },
};
