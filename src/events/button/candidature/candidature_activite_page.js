const {
  StringSelectMenuBuilder,
  MessageFlags,
  ContainerBuilder,
  ButtonStyle,
  AttachmentBuilder,
  MediaGalleryBuilder,
  ButtonBuilder,
} = require("discord.js");
const { getEmojiTete } = require("../../../../util/module/emoji");
const { getServeur } = require("../../../../util/module/getServeur");
const { generateConnexionGraph } = require("../../../../util/connexion");

module.exports = {
  data: {
    name: "candidature_activite_page",
  },

  async execute(client, interaction, config) {
    const serveur = await getServeur(interaction);
    const joueur = interaction.customId.split("/")[1];
    const semaineOffset = Number(interaction.customId.split("/")[2]);

    const res = await fetch(
      `${config.glorybot_url}/api/activiteJoueurInfo?serveur=${serveur}&joueur=${joueur}&administrator=true`,
    );
    const data = await res.json();

    if (!data || data.length === 0) {
      const container = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((t) => t.setContent("## ❌ Erreur"))
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `Le joueur "**${joueur}**" n'existe pas ou n'apparait pas dans les données du serveur ${config.serveur[serveur].emoji_formate} **${config.serveur[serveur].nom}**.`,
          ),
        );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    await interaction.deferUpdate({});

    const tempsJeu = data.reduce((acc, entry) => {
      if (!acc[entry.date]) acc[entry.date] = 0;
      acc[entry.date] += entry.temps;
      return acc;
    }, {});

    const today = new Date();

    const now = new Date();
    const jours = [
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
      "Dimanche",
    ];

    now.setDate(now.getDate() + semaineOffset * 7);

    const base = new Date(today);
    const currentDay = base.getDay();
    const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
    base.setDate(base.getDate() + diffToMonday);
    base.setDate(base.getDate() + semaineOffset * 7);

    const monday = new Date(today);
    const currentDay2 = monday.getDay();
    const diffToMonday2 = (currentDay2 === 0 ? -6 : 1) - currentDay2;
    monday.setDate(monday.getDate() + diffToMonday2 + semaineOffset * 7);

    const mondayFormatted = monday.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    let description = "";

    const labels = [];
    const values = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + diffToMonday + i);

      const day = ("0" + date.getDate()).slice(-2);
      const month = ("0" + (date.getMonth() + 1)).slice(-2);
      const year = date.getFullYear();
      const dateString = `${day}-${month}-${year}`;

      labels.push(jours[i]);
      values.push(tempsJeu[dateString] || 0);

      const tempsSec = tempsJeu[dateString] || 0;
      const temps = formatDuration(tempsSec);

      description += `**${jours[i]} ${day} ${moisEnTexte(
        month,
      )} :** ${temps}\n`;
    }

    const total = values.reduce((acc, val) => acc + val, 0);
    const moyenne = values.length > 0 ? total / values.length : 0;
    description += `\n**Moyenne de connexion cette semaine :** ${formatDuration(
      Math.floor(moyenne),
    )}`;

    const buffer = await generateConnexionGraph(
      serveur,
      tempsJeu,
      semaineOffset,
      true,
    );

    const attachment = new AttachmentBuilder(buffer, {
      name: "candidature_activite.png",
    });

    const emojiTete = (await getEmojiTete(client, joueur)) || "⏱️";

    const container = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## ${emojiTete} Activité - ${joueur.replace(/\\/g, "\\\\").replace(/_/g, "\\_")}`,
        ),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) => t.setContent(description))
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems((mediaGalleryItem) =>
          mediaGalleryItem.setURL("attachment://candidature_activite.png"),
        ),
      )
      .addActionRowComponents((row) =>
        row.setComponents(
          new ButtonBuilder()
            .setCustomId(
              `candidature_activite_page-/${joueur}/${semaineOffset - 1}`,
            )
            .setLabel("⬅️ Semaine précédente")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`candidature_activite_status`)
            .setLabel(`Semaine du ${mondayFormatted}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(
              `candidature_activite_page-/${joueur}/${semaineOffset + 1}`,
            )
            .setLabel("Semaine suivante ➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(semaineOffset >= 0),
        ),
      );

    return interaction.editReply({
      files: [attachment],
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  },
};

function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  let result = "";

  if (h > 0) result += `${h} heure${h > 1 ? "s" : ""} `;
  if (m > 0) result += `${m} minute${m > 1 ? "s" : ""}  `;
  if (s > 0 || result === "") result += `${s} seconde${s > 1 ? "s" : ""} `;

  return result.trim();
}

function moisEnTexte(num) {
  const noms = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  return noms[parseInt(num, 10) - 1];
}
