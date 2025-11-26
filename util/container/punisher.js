const {
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getEmojiTete } = require("../../util/module/emoji");

async function getPunisherContainer(
  joueur,
  sanctions,
  page,
  maxPage,
  embedColor,
  config,
  PER_PAGE,
  serveur = "all",
  client,
) {
  const slice = sanctions.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const desc = slice.length
    ? (
        await Promise.all(
          slice.map(async (s) => {
            const ts = s.date
              ? `<t:${Math.floor(new Date(s.date).getTime() / 1000)}:R>`
              : "";
            const duree =
              s.type === "Warn"
                ? ""
                : s.duree === "Def"
                  ? "définitif "
                  : s.duree
                    ? `pendant ${s.duree} `
                    : "";
            const emoji = config.emoji_formate[s.serveur] || "";
            const emojiTete = await getEmojiTete(client, s.staff);
            return `${emoji} **${s.type}** ${duree}pour **${s.raison}** par ${emojiTete} **${s.staff}** ${ts}`;
          }),
        )
      ).join("\n\n")
    : "🎉 Aucune sanction trouvée";

  const sanctionContainer = new ContainerBuilder()
    .setAccentColor(embedColor)
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(`## 💢 Sanction de ${joueur}`),
    )
    .addSeparatorComponents((separator) => separator)
    .addTextDisplayComponents((textDisplay) => textDisplay.setContent(desc))
    .addSeparatorComponents((separator) => separator)
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`punisher-prev-${joueur}-${page}-${serveur}`)
          .setLabel("◀️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page <= 1),
        new ButtonBuilder()
          .setCustomId(`punisher-${page}`)
          .setLabel(`Page ${page}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`punisher-next-${joueur}-${page}-${serveur}`)
          .setLabel("▶️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page >= maxPage),
      ),
    );

  return sanctionContainer;
}

module.exports = { getPunisherContainer };
