const config = require("../../config");
const {
  getData,
  getAbsolutePath,
} = require("../../util/module/getAndSaveData");
const { getEmojiTete } = require("../../util/module/emoji");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  ContainerBuilder,
  MediaGalleryBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");

async function repartition_notation(client) {
  for (const server of config.liste_serveur) {
    try {
      const repartitionData = getData(`data/${server}/config-notation.json`);
      const keys = Object.keys(repartitionData["répartition"]);
      const hasNumberKey = keys.some(
        (key) => key !== "active" && key !== "Salon" && key !== "Role",
      );
      if (
        repartitionData["répartition"].active &&
        repartitionData["répartition"].Salon &&
        hasNumberKey
      ) {
        let linkData;
        try {
          const response = await fetch(`${config.glorybot_url}/api/get-ng`);
          const json = await response.json();

          if (!json.success || !json.data) {
            throw new Error("Réponse invalide de l'API get-ng");
          }

          linkData = json.data;
        } catch (err) {
          console.error(
            "Erreur lors de la récupération des données depuis l'API get-ng:",
            err,
          );
        }

        const numberKeys = keys.filter(
          (key) => !["active", "Salon", "Role"].includes(key),
        );

        const numberKeysValues = (
          await Promise.all(
            numberKeys.map(async (key) => {
              const emoji = await getEmojiTete(client, key);
              const emojiText = emoji.id
                ? `<:${emoji.name}:${emoji.id}>`
                : emoji.name;
              return `${emojiText} ${key} : ${repartitionData["répartition"][key]}`;
            }),
          )
        ).join("\n");

        const imagePath = config.liste_serveur_bedrock.includes(server)
          ? getAbsolutePath("data/ordredesnotations_bedrock.png")
          : getAbsolutePath("data/ordredesnotations_java.png");

        const attachment = new AttachmentBuilder(imagePath, {
          name: "ordre-des-notations.png",
        });

        const now = new Date();
        const day = now.getDay();
        const daysSinceMonday = (day + 6) % 7;
        const lastMonday = new Date(now);
        lastMonday.setDate(now.getDate() - daysSinceMonday);

        const jour = String(lastMonday.getDate()).padStart(2, "0");
        const mois = String(lastMonday.getMonth() + 1).padStart(2, "0");

        const repartitionContainer = new ContainerBuilder()
          .setAccentColor(config.couleur[server])
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              `## Annonce des Notations - Semaine du ${jour}/${mois}`,
            ),
          )
          .addSeparatorComponents((separator) => separator)
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              `Voici la liste des staffs qui sont en charge des notations, si vous avez un recours à faire, il est préférable de s'adresser à la bonne qui vous a noté sur le [serveur Discord global de NationsGlory](https://discord.gg/nationsglory).\n\n${numberKeysValues}`,
            ),
          )
          .addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems((mediaGalleryItem) =>
              mediaGalleryItem.setURL("attachment://ordre-des-notations.png"),
            ),
          )
          .addSeparatorComponents((separator) => separator)
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("notation_help")
                .setLabel("Informations Supplémentaires")
                .setStyle(ButtonStyle.Success),
            ),
          );

        const salon = client.channels.cache.get(
          repartitionData["répartition"].Salon,
        );
        if (repartitionData["répartition"]?.Role) {
          const roleMentions = repartitionData["répartition"].Role.map(
            (roleId) => `<@&${roleId}>`,
          ).join(", ");

          const roleTextDisplay = new TextDisplayBuilder().setContent(
            roleMentions,
          );

          await salon.send({
            files: [attachment],
            components: [roleTextDisplay, repartitionContainer],
            flags: MessageFlags.IsComponentsV2,
          });
        } else {
          await salon.send({
            files: [attachment],
            components: [repartitionContainer],
            flags: MessageFlags.IsComponentsV2,
          });
        }
      }
    } catch (e) {
      console.log("Erreur lors de l'envoie du message de répartition :", e);
    }
  }
}

module.exports = { repartition_notation };
