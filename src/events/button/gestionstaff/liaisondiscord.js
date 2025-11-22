const {
  ModalBuilder,
  UserSelectMenuBuilder,
  LabelBuilder,
} = require("discord.js");
const { discordLink } = require("../../../../util/module/discordLink");

module.exports = {
  data: {
    name: "gestionstaff_liaisondiscord",
  },

  conf: {
    type: "User",
  },

  async execute(client, interaction, config) {
    const joueur = interaction.customId.split("-")[1];

    const linkedDiscordIdData = (await discordLink(false)).data;
    const linkedDiscordId = Object.keys(linkedDiscordIdData).find(
      (id) =>
        typeof linkedDiscordIdData[id] === "string" &&
        linkedDiscordIdData[id].toLowerCase() === joueur.toLowerCase(),
    );

    const modal = new ModalBuilder()
      .setCustomId(`gestionstaff_liaisondiscord-${joueur}`)
      .setTitle(
        linkedDiscordId
          ? "Modifier la Liaison Discord"
          : "Ajouter une Liaison Discord",
      );

    const input = new LabelBuilder()
      .setLabel("Utilisateur Discord")
      .setDescription("Choisit l'utilisateur à lier")
      .setUserSelectMenuComponent(
        new UserSelectMenuBuilder()
          .setCustomId(`id_discord`)
          .setPlaceholder("Choisit l'utilisateur à lier")
          .setRequired(true)
          .setMaxValues(1)
          .setDefaultUsers(linkedDiscordId),
      );

    modal.addLabelComponents(input);

    await interaction.showModal(modal);
  },
};
