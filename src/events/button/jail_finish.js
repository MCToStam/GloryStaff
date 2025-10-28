const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getData, saveData } = require("../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "jail_finish",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const embedColor = interaction.message.embeds[0]?.color;

    const serveur = Object.keys(config.couleur).find(
      (key) => config.couleur[key] === embedColor,
    );

    await interaction.deferReply({ ephemeral: true });

    let pseudo;
    try {
      const response = await fetch(
        `${config.glorybot_url}/api/get-ng?discordId=${interaction.user.id}`,
      );
      if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
      const data = await response.json();

      pseudo = data.pseudo || null;
    } catch (e) {
      pseudo = null;
    }

    if (!pseudo) {
      const erreurEmbed = new EmbedBuilder()
        .setTitle("Erreur")
        .setColor(config.errorcolor)
        .setDescription(
          'Votre compte Discord n\'est pas reconnu, il vous faut être renseigné pour utiliser cette commande. Pour ce faire, il te suffit de te connecter à notre panel de contrôle. Une fois connecté avec ton compte Discord, va dans la partie "Profil" puis tu as un bouton afin de lier ton compte NationsGlory.',
        )
        .setFooter({ text: config.footer });

      const panelButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("💻 Accéder au panel")
          .setStyle(ButtonStyle.Link)
          .setURL("https://glorybot.fr"),
      );

      return interaction.editReply({
        embeds: [erreurEmbed],
        components: [panelButton],
        ephemeral: true,
      });
    }

    const staffData = getData(`data/${serveur}/staff-serveur.json`);

    const configJail = getData(`data/${serveur}/config-jail.json`);
    const roleAutorise = configJail.jail.Grade;

    const gradesHierarchie = [
      "Administrateur",
      "Super-Modérateur",
      "Modérateur Plus",
      "Modérateur",
      "Modérateur Test",
      "Guide",
    ];

    const indexRoleAutorise = gradesHierarchie.indexOf(roleAutorise);
    const utilisateurAutorise = gradesHierarchie
      .slice(0, indexRoleAutorise + 1)
      .some((grade) => staffData[grade] && staffData[grade].includes(pseudo));

    if (!utilisateurAutorise) {
      const erreurEmbed = new EmbedBuilder()
        .setTitle("Erreur")
        .setColor(config.errorcolor)
        .setDescription(
          `Vous ne possédez pas le rôle ${
            config.emojigrade[roleAutorise]
          } **${roleAutorise}** sur le serveur <:NG${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }:${config.emoji[serveur.toLowerCase()]}> **${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }**.`,
        )
        .setFooter({ text: config.footer });
      return interaction.editReply({
        embeds: [erreurEmbed],
        ephemeral: true,
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
          jailData[group][entryIndex].staff = pseudo;
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
