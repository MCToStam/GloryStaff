const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getData } = require("../../../util/module/getAndSaveData");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("salaire-post")
    .setDescription("Poste les salaires du mois")
    .addStringOption((option) =>
      option
        .setName("mois")
        .setDescription("Le mois pour lequel vous souhaitez voir les salaires")
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async execute(client, interaction, config) {
    const channelData = getData("data/black/avocat/channel.json");
    const allowedRoles = [
      channelData.role_niveau4,
      channelData.role_responsable,
    ];
    const memberRoles = interaction.member.roles.cache;

    const hasRole = allowedRoles.some((role) => memberRoles.has(role));

    if (!hasRole) {
      const permEmbed = new EmbedBuilder()
        .setTitle("Erreur")
        .setDescription(
          `Il te faut être <@&${allowedRoles[0]}> ou <@&${allowedRoles[1]}> afin de pouvoir faire ceci.`,
        )
        .setColor(config.errorcolor)
        .setFooter({ text: config.footer });

      return interaction.reply({ embeds: [permEmbed], ephemeral: true });
    }

    const data = getData("data/black/avocat/salaire.json");

    const specifiedMonth = interaction.options.getString("mois").toLowerCase();

    let description = "";
    let totalSalaireMois = 0;
    data.forEach((person) => {
      const salaire = person.salaire[specifiedMonth];
      if (salaire) {
        description += `<@${person.id}> ( ${person.pseudo} ) : ${salaire}$\n`;
        totalSalaireMois += salaire;
      }
    });

    if (description) {
      description += `\n\n> **Total :** ${totalSalaireMois}$`;
    }

    if (!description) {
      const pasMoisEmbed = new EmbedBuilder()
        .setTitle("Erreur")
        .setDescription(
          `Aucun salaire n'a été trouvé pour le mois "${specifiedMonth}".`,
        )
        .setColor(config.errorcolor)
        .setFooter({ text: config.footer });
      return interaction.reply({ embeds: [pasMoisEmbed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(
        `Salaires du mois de ${
          specifiedMonth.charAt(0).toUpperCase() + specifiedMonth.slice(1)
        }`,
      )
      .setDescription(description)
      .setColor(config.color)
      .setFooter({ text: config.footer });

    const channel = await client.channels.fetch(channelData.salaire);
    await channel.send({
      embeds: [embed],
      content: `<@&${channelData.salaire_role}>`,
    });

    let salaireTotal = 0;
    let ecoGiveInstructions = "";

    data.forEach((person) => {
      const salaire = person.salaire[specifiedMonth];
      if (salaire) {
        salaireTotal += salaire;
        ecoGiveInstructions += `\n\`\`\`/eco give ${person.pseudo} ${salaire}\n\`\`\``;
      }
    });

    const staffEmbed = new EmbedBuilder()
      .setTitle(
        `Salaires du mois de ${
          specifiedMonth.charAt(0).toUpperCase() + specifiedMonth.slice(1)
        }`,
      )
      .setDescription(
        `Prendre l'argent dans la banque ONU :\n\`\`\`/econ bank take ONU ${salaireTotal}\`\`\`\nDonner l'argent aux RPs :\n${ecoGiveInstructions}`,
      )
      .setColor(config.color)
      .setFooter({ text: config.footer });

    await interaction.reply({ embeds: [staffEmbed], ephemeral: true });
  },
};
