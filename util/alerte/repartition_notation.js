const config = require("../../config");
const {
  getData,
  getAbsolutePath,
} = require("../../util/module/getAndSaveData");
const { getEmojiTete } = require("../../util/module/emoji");
const Configuration = require("../../util/database/models/Configuration");
const Absence = require("../../util/database/models/Absence");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  ContainerBuilder,
  MediaGalleryBuilder,
  TextDisplayBuilder,
  MessageFlags,
  ChannelType,
} = require("discord.js");

async function genererNouvelleRepartition(donnee, serveur) {
  const now = new Date();

  const saturday = new Date(now);
  saturday.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7));
  saturday.setHours(0, 0, 0, 0);

  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  sunday.setHours(23, 59, 59, 999);

  const absences = await Absence.find({
    serveur,
    debut: { $lte: sunday },
    fin: { $gte: saturday },
  });

  const staffsAbsents = new Set(absences.map((a) => a.staff.toLowerCase()));

  const staffsPresents = Object.entries(donnee).filter(
    ([staff]) => !staffsAbsents.has(staff.toLowerCase()),
  );

  if (staffsPresents.length === 0) return {};

  const lastRange = Object.values(donnee)[Object.values(donnee).length - 1];

  const maxNotation = parseInt(lastRange.split(" à ")[1], 10);

  const totalStaffs = staffsPresents.length;

  const baseSize = Math.floor(maxNotation / totalStaffs);
  const remainder = maxNotation % totalStaffs;

  let current = 1;

  const nouvelleRepartition = {};

  staffsPresents.forEach(([staff], index) => {
    const extra = index < remainder ? 1 : 0;
    const end = current + baseSize + extra - 1;

    nouvelleRepartition[staff] = `${current} à ${end}`;

    current = end + 1;
  });

  return nouvelleRepartition;
}

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
      const configurations = await Configuration.find({
        serveur: server,
        categorie: "Notations",
        systeme: "Répartition",
      });

      for (const configRepartition of configurations) {
        if (!configRepartition.active) continue;

        const donneeOriginale = configRepartition.data.get("donnee");
        if (!donneeOriginale) continue;

        const donnee = await genererNouvelleRepartition(
          donneeOriginale,
          server,
        );
        if (!Object.keys(donnee).length) continue;

        const guildId = configRepartition.guildId;

        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;

        const channelId = configRepartition.data.get("Salon");
        if (!channelId) continue;

        const channel = guild.channels.cache.get(channelId);
        if (!channel) continue;

        const roleIds = configRepartition.data.get("Role") || [];
        const roleMentions = roleIds.map((id) => `<@&${id}>`).join(" ");

        const numberKeysValues = (
          await Promise.all(
            Object.entries(donnee).map(async ([key, value]) => {
              const emoji = (await getEmojiTete(client, key)) || "🧑";
              const emojiText = emoji.id
                ? `<:${emoji.name}:${emoji.id}>`
                : emoji.name;

              return `${emojiText} **${key.replace(/_/g, "\\_")} :** ${value}`;
            }),
          )
        ).join("\n");

        const repartitionContainer = new ContainerBuilder()
          .setAccentColor(config.couleur[server])
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              `## 🏆 Annonce des Notations - Semaine du ${jour}/${mois}`,
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

          if (channel.type === ChannelType.GuildNews)
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
