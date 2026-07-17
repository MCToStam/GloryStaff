const {
  SlashCommandBuilder,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const allConfig = require("../../../util/container/allConfig");
const proxyCommande = require("../../../util/proxy/proxyCommande");
const { replyOrUpdate } = require("../../../util/proxy/reply");

module.exports = {
  config: { permission: "guide" },
  data: new SlashCommandBuilder()
    .setContexts(0)
    .setName("config")
    .setDescription("Affiche la configuration d’un système"),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur } = interaction.parametre;

    const container = await allConfig(serveur, interaction.user.id);

    await replyOrUpdate(interaction, [container]);
  },
};
