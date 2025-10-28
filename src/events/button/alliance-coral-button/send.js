const {
  ModalBuilder,
  ChannelSelectMenuBuilder,
  LabelBuilder,
  ChannelType,
} = require("discord.js");

module.exports = {
  data: {
    name: "alliance_send",
  },

  conf: {
    type: "Button",
  },

  async execute(client, interaction, config) {
    const allianceNom = interaction.customId.replace("alliance_send-", "");

    const modal = new ModalBuilder()
      .setCustomId(`modal_alliance_send-${allianceNom}`)
      .setTitle("Envoyer l’effectif de l’alliance");

    const channelInput = new LabelBuilder()
      .setLabel("Salon ou Fil du serveur")
      .setDescription("Le salon où sera envoyé l'effectif")
      .setChannelSelectMenuComponent(
        new ChannelSelectMenuBuilder()
          .setCustomId("channelId")
          .setPlaceholder("Sélectionne un salon...")
          .setRequired(true)
          .setMaxValues(1)
          .addChannelTypes(
            ChannelType.GuildText,
            ChannelType.GuildAnnouncement,
            ChannelType.PublicThread,
            ChannelType.PrivateThread,
          ),
      );

    modal.addLabelComponents(channelInput);

    return interaction.showModal(modal);
  },
};
