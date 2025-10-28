const { EmbedBuilder } = require("discord.js");
const { getData, saveData } = require("../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "liaisonop_add_modal",
  },

  async execute(client, interaction, config) {
    const id = interaction.fields.getTextInputValue("liaisonop-id");

    let user;
    try {
      user = await client.users.fetch(id);
    } catch (err) {
      const embed = new EmbedBuilder()
        .setTitle("Erreur")
        .setDescription(`L'utilisateur avec l'ID \`${id}\` est introuvable.`)
        .setColor(config.errorcolor)
        .setFooter({ text: config.footer });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embedColor = interaction.message.embeds[0]?.color;

    const serveur = Object.keys(config.couleur).find(
      (key) => config.couleur[key] === embedColor,
    );

    const botStaffData = getData(`data/${serveur}/staff.json`);

    botStaffData["Super-Modérateur"].push(id);
    const supportGuild = await client.guilds.fetch(config.support_serveur_id);
    const isInSupportServer = await supportGuild.members
      .fetch(id)
      .catch(() => null);

    if (isInSupportServer) {
      const member = await supportGuild.members.fetch(id);
      const role = supportGuild.roles.cache.get(
        config.role[serveur.toLowerCase()],
      );
      await member.roles.add(role);
    }

    saveData(`data/${serveur}/staff.json`, botStaffData);

    let description = "";
    for (const [grade, members] of Object.entries(botStaffData)) {
      if (members.length > 0) {
        const emoji = config.emojigrade[grade] || "";
        const memberMentions = members.map((id) => `<@${id}>`).join(", ");
        description += `**${emoji} ${grade} :** ${memberMentions}\n`;
      }
    }

    description = description || "Aucun opérateur lié au robot n'a été trouvé.";

    const embed = new EmbedBuilder()
      .setTitle("Liste des Opérateurs liés au robot")
      .setDescription(description)
      .setColor(config.couleur[serveur])
      .setFooter({ text: config.footer });

    return interaction.update({ embeds: [embed], ephemeral: true });
  },
};
