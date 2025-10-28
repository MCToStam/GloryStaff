const { EmbedBuilder } = require("discord.js");
const { getData } = require("../../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "gestionstaff_routine",
  },

  async execute(client, interaction, config) {
    const embedColor = interaction.message.embeds[0]?.color;

    const serveur = Object.keys(config.couleur).find(
      (key) => config.couleur[key] === embedColor
    );

    const joueur = interaction.message.embeds[0]?.title?.split("- ")[1]?.trim();
    
    const data = getData(`data/${serveur}/routine.json`)

    if (!data[joueur]) {
      return interaction.reply({
        content: "Aucune donnée trouvée pour ce joueur.",
        ephemeral: true,
      });
    }

    const now = new Date();

    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const firstDayOfWeek = new Date(now);
    firstDayOfWeek.setDate(now.getDate() + diffToMonday);
    firstDayOfWeek.setHours(0, 0, 0, 0);

    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999);

    const startOfWeek = Math.floor(firstDayOfWeek.getTime() / 1000);
    const endOfWeek = Math.floor(lastDayOfWeek.getTime() / 1000);

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);
    const startOfMonth = Math.floor(firstDayOfMonth.getTime() / 1000);
    const endOfMonth = Math.floor(lastDayOfMonth.getTime() / 1000);

    const routinesSemaine = data[joueur].routine.filter(
      (timestamp) => timestamp >= startOfWeek && timestamp <= endOfWeek
    );
    const routinesMois = data[joueur].routine.filter(
      (timestamp) => timestamp >= startOfMonth && timestamp <= endOfMonth
    );

    const embed = new EmbedBuilder()
      .setTitle(`Routine - ${joueur.replace(/_/g, "\\_")}`)
      .setDescription(
        `**Dernière routine :** <t:${data[joueur].derniere_routine}:f> ・ <t:${
          data[joueur].derniere_routine
        }:R>\n\n**Routines cette semaine :** ${routinesSemaine.length.toString()}\n**Routines ce mois-ci :** ${routinesMois.length.toString()}\n**Routines totales :** ${
          data[joueur].routine.length
        }`
      )
      .setColor(config.couleur[serveur])
      .setFooter({ text: config.footer });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
