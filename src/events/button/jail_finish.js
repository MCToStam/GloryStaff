const { ContainerBuilder, MessageFlags } = require("discord.js");
const { getEmojiTete } = require("../../../util/module/emoji");
const { getData, saveData } = require("../../../util/module/getAndSaveData");
const { discordStaff } = require("../../../util/module/discordLink");
const { getServeur } = require("../../../util/module/getServeur");

module.exports = {
  data: {
    name: "jail_finish",
  },

  async execute(client, interaction, config) {
    const embedColor = interaction.message?.embeds[0]?.color;

    const serveur =
      Object.keys(config.couleur).find(
        (key) => config.couleur[key] === embedColor,
      ) || (await getServeur(interaction));

    const dataFile = getData(`data/${serveur}/config.json`);
    const configData = dataFile.find((c) => c.nom === "Jail");
    const configJail = configData.systeme["Jail"];

    const roleAutorise = configJail.Grade.valeur[interaction.guild.id];

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
      const thread = await client.channels.fetch("1377730953153220770");
      if (thread?.isThread()) {
        const message = `<@${interaction.user.id}> a effectué le jail de **${jailedUser}** durant **${jailInfo.duree}** pour la raison :\n> ${jailInfo.lien}`;
        await thread.send({ content: message });
      }
    }

    await interaction.message.delete();

    if (threadIdToDelete) {
      const thread = await client.channels.fetch(threadIdToDelete);
      if (thread?.isThread()) {
        await thread.delete("Suppression du thread après la fin du jail");
      }
    }

    const emojiTete = (await getEmojiTete(client, jailedUser)) || "🧑";
    const userContainer = new ContainerBuilder()
      .setAccentColor(config.colors.success)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## ✅ Jail Effectué"),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `Le jail de ${emojiTete ? `${emojiTete} ` : ""}**${jailedUser}** durant **${
            jailInfo.duree
          }** a correctement été supprimé.`,
        ),
      );

    return interaction.reply({
      components: [userContainer],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
