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
          { name: "Attente Staff", value: "Attente Staff" },
          { name: "Candidature", value: "Candidature" },
          { name: "Disband", value: "Disband" },
          { name: "Double Lead", value: "Double Lead" },
          { name: "Expansion Territoriale", value: "Expansion Territoriale" },
          { name: "Forum", value: "Forum" },
          { name: "Jail", value: "Jail" },
          { name: "Joueur(s) Connecté(s)", value: "Joueur(s) Connecté(s)" },
          { name: "Notations", value: "Notations" },
          { name: "ONU", value: "ONU" },
          { name: "Récapitulatif", value: "Récapitulatif" },
          { name: "Routine", value: "Routine" },
          { name: "Staff", value: "Staff" },
        ),
    ),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur, type } = interaction.parametre;

    const configData = getData(`data/${serveur}/config.json`);
    const typeData = configData.find((c) => c.nom === type);
    const keys = Object.keys(typeData.systeme);

    if (keys.length === 1) {
      const systemName = keys[0];
      const container = await containerSingle(
        interaction.guild.id,
        serveur,
        systemName,
        typeData,
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
      const container = await containerMultiple(
        interaction.guild.id,
        serveur,
        type,
        typeData,
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
    }
  },
};
