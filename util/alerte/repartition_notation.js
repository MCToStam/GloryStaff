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
  const now = new Date();
  const day = now.getDay();
  const daysSinceMonday = (day + 6) % 7;
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - daysSinceMonday);

  const jour = String(lastMonday.getDate()).padStart(2, "0");
  const mois = String(lastMonday.getMonth() + 1).padStart(2, "0");

  for (const server of config.liste_serveur) {
    const imagePath = config.liste_serveur_bedrock.includes(server)
      ? getAbsolutePath("data/ordredesnotations_bedrock.png")
      : getAbsolutePath("data/ordredesnotations_java.png");

    const attachment = new AttachmentBuilder(imagePath, {
      name: "ordre-des-notations.png",
    });

    try {
      const configGlobale = getData(`data/${server}/config.json`);
      const configNotation = configGlobale.find((c) => c.nom === "Notations");
      const configRepartition = configNotation.systeme.Répartition;

      if (
        !Object.values(configRepartition.active || {}).some(
          (value) => value === true,
        )
      )
        continue;

      for (const [guildId, isActive] of Object.entries(
        configRepartition.active || {},
      )) {
        if (!isActive) continue;

        const donnee = configRepartition.donnee[guildId];
        if (!donnee) continue;

        const channelId = configRepartition.Salon?.valeur?.[guildId];
        if (!channelId) continue;

        const channel = await client.channels.fetch(channelId);
        if (!channel) continue;

        const roleIds = configRepartition.Role?.valeur?.[guildId] || [];
        const roleMentions = roleIds.map((id) => `<@&${id}>`).join(" ");

        const numberKeysValues = (
          await Promise.all(
            Object.entries(configRepartition.donnee[guildId]).map(
              async ([key, value]) => {
                const emoji = (await getEmojiTete(client, key)) || "🧑";
                const emojiText = emoji.id
                  ? `<:${emoji.name}:${emoji.id}>`
                  : emoji.name;

                return `${emojiText} ${key.replace(/_/g, "\\_")} : ${value}`;
              },
            ),
          )
        ).join("\n");

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

        let components = [repartitionContainer];
        if (roleMentions)
          components = [
            new TextDisplayBuilder().setContent(roleMentions),
            repartitionContainer,
          ];

        try {
          const sent = await channel.send({
            components,
            files: [attachment],
            flags: MessageFlags.IsComponentsV2,
          });

          if (channel.type === "GUILD_NEWS")
            await sent.crosspost().catch(() => {});

          console.log(
            `✅ Message notations répartition envoyé | serveur ${server} | guild ${guildId}`,
          );
        } catch (err) {
          console.error(
            `❌ Erreur envoi notations répartition | serveur ${server} | guild ${guildId}`,
            err,
          );
        }
      }
    } catch (e) {
      console.log("Erreur lors de l'envoie du message de répartition :", e);
    }
  }
}

module.exports = { repartition_notation };
