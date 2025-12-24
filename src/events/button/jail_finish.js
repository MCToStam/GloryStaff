const { EmbedBuilder, MessageFlags } = require("discord.js");
const { getData, saveData } = require("../../../util/module/getAndSaveData");
const { discordStaff } = require("../../../util/module/discordLink");

module.exports = {
  data: {
    name: "jail_finish",
  },

  async execute(client, interaction, config) {
    const embedColor = interaction.message.embeds[0]?.color;

    const serveur = Object.keys(config.couleur).find(
      (key) => config.couleur[key] === embedColor,
    );

    await interaction.deferReply({ ephemeral: true });

    const configJail = getData(`data/${serveur}/config-jail.json`);
    const roleAutorise = configJail.jail.Grade.valeur;

    const gradeAutorise = {
      Administrateur: "administrateur",
      "Super-Modérateur": "super_moderateur",
      "Modérateur Plus": "moderateur_plus",
      Modérateur: "moderateur",
      "Modérateur Test": "moderateur_test",
      Guide: "guide",
    };

    const { pseudonym, servers, container } = await discordStaff(
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

    const jailData = getData(`data/${serveur}/jail.json`);

    const messageId = interaction.message.id;
    let threadIdToDelete = messageId;
    let updated = false;

    let jailInfo = null;
    let jailedUser = null;

    for (const group in jailData) {
      if (jailData.hasOwnProperty(group)) {
        const entryIndex = jailData[group].findIndex(
          (entry) => entry.messageId === messageId,
        );

        if (entryIndex !== -1) {
          jailInfo = jailData[group][entryIndex];
          jailedUser = group;

          jailData[group][entryIndex].jailed = true;
          jailData[group][entryIndex].staff = pseudonym;
          jailData[group][entryIndex].date = Math.floor(Date.now() / 1000);
          delete jailData[group][entryIndex].messageId;
          delete jailData[group][entryIndex].threadId;
          delete jailData[group][entryIndex].channelId;
          delete jailData[group][entryIndex].connecte;
          updated = true;
        }
      }
    }

    if (updated) {
      saveData(`data/${serveur}/jail.json`, jailData);
    }

    if (serveur === "cyan" && jailInfo && jailedUser) {
      try {
        const thread = await client.channels.fetch("1377730953153220770");
        if (thread?.isThread()) {
          const message = `<@${interaction.user.id}> a effectué le jail de **${jailedUser}** durant **${jailInfo.duree}** pour la raison :\n> ${jailInfo.lien}`;
          await thread.send({ content: message });
        }
      } catch (err) {
        console.error("Erreur lors de l'envoi dans le thread cyan :", err);
      }
    }

    try {
      await interaction.message.delete();
    } catch (err) {
      console.error("Erreur lors de la suppression du message :", err);
    }

    if (threadIdToDelete) {
      try {
        const thread = await client.channels.fetch(threadIdToDelete);
        if (thread?.isThread()) {
          await thread.delete("Suppression du thread après la fin du jail");
        }
      } catch (err) {
        console.error("Erreur lors de la suppression du thread :", err);
      }
    }

    const userEmbed = new EmbedBuilder()
      .setTitle("🚧 Jail")
      .setColor(config.couleur[serveur])
      .setDescription("Ce jail a correctement été supprimé !")
      .setFooter({ text: config.footer });

    return interaction.editReply({ embeds: [userEmbed], ephemeral: true });
  },
};
