const {
  SlashCommandBuilder,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const allConfig = require("../../../util/container/allConfig");
const proxyCommande = require("../../../util/proxy/proxyCommande");

module.exports = {
  guild: true,
  config: { permission: "guide" },
  data: new SlashCommandBuilder()
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setName("config")
    .setDescription("Affiche la configuration d’un système"),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur } = interaction.parametre;

    const container = await allConfig(serveur, interaction.user.id);
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
  },
};
