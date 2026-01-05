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
    const serveur = await proxyCommande(interaction);
    if (!serveur) return;

    const type = interaction.options.getString("type").toLowerCase();

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
