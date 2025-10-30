const { EmbedBuilder } = require("discord.js");
const config = require("../../../../config");
const { getData, saveData } = require("../../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "assassinat_epsilon_fin",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const customId = interaction.customId;
    const isKill = customId.endsWith("-kill");

    const data = getData("data/epsilon/assassinat/donnee.json");
    const configData = getData("data/epsilon/assassinat/config.json");
    const messageId = interaction.message.id;
    const assassinat = data.find((d) => d.messageId === messageId);

    if (!assassinat) {
      return interaction.reply({
        content:
          "⚠️ Impossible de retrouver cet assassinat dans la base de données.",
        ephemeral: true,
      });
    }

    const index = data.indexOf(assassinat);
    if (index !== -1) data.splice(index, 1);
    saveData("data/epsilon/assassinat/donnee.json", data);

    const status = isKill ? "Kill effectué" : "Mission échouée";
    const color = isKill ? "Green" : "Red";
    const emoji = isKill ? "✅" : "❌";

    const embed = new EmbedBuilder()
      .setTitle(`${emoji} ${status}`)
      .setColor(color)
      .setFooter({ text: config.footer })
      .setDescription(
        `**Client :** ${assassinat.pseudoClient}\n` +
          `**Cible :** ${assassinat.pseudoCible}\n` +
          `**Assassins :** ${
            assassinat.listeAssassin.length
              ? assassinat.listeAssassin.map((id) => `<@${id}>`).join(", ")
              : "*Aucun assassin enregistré*"
          }\n`,
      );

    await interaction.update({
      content: `${emoji} L'assassinat a été marqué comme **${status.toLowerCase()}**.`,
      embeds: [],
      components: [],
    });

    try {
      await interaction.message.delete();
    } catch (err) {
      console.warn(
        `[Assassinat] Impossible de supprimer le message : ${err.message}`,
      );
    }

    const logChannel = client.channels.cache.get(
      configData.logChannelAssassinat,
    );
    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
    } else {
      console.warn(
        `[Assassinat] Salon de log introuvable (${configData.logChannelAssassinat})`,
      );
    }
  },
};
