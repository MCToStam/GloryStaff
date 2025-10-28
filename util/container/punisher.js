const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

function getPunisherContainer(
  joueur,
  sanctions,
  page,
  maxPage,
  embedColor,
  config,
  PER_PAGE,
  serveur = "all"
) {
  const slice = sanctions.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const desc = slice.length
    ? slice
        .map((s) => {
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
          return `${emoji} **${s.type}** ${duree}pour **${s.raison}** par **${s.staff}** ${ts}`;
        })
        .join("\n\n")
    : "🎉 Aucune sanction trouvée";

  const embed = new EmbedBuilder()
    .setTitle(`Sanctions de ${joueur}`)
    .setDescription(desc)
    .setColor(embedColor)
    .setFooter({ text: config.footer });

  const makeBtn = (id, label, style, disabled = false, emoji = null) =>
    new ButtonBuilder()
      .setCustomId(id)
      .setStyle(style)
      .setDisabled(disabled)
      [emoji ? "setEmoji" : "setLabel"](emoji || label);

  const row = new ActionRowBuilder().addComponents(
    makeBtn(
      `punisher-prev-${joueur}-${page}-${serveur}`,
      "",
      ButtonStyle.Primary,
      page <= 1,
      "◀️"
    ),
    makeBtn(`punisher-${page}`, `Page ${page}`, ButtonStyle.Secondary, true),
    makeBtn(
      `punisher-next-${joueur}-${page}-${serveur}`,
      "",
      ButtonStyle.Primary,
      page >= maxPage,
      "▶️"
    )
  );

  return { embed, row };
}

module.exports = { getPunisherContainer };
