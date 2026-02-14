const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
  AttachmentBuilder,
  TextDisplayBuilder,
} = require("discord.js");
const { getAbsolutePath } = require("../../../util/module/getAndSaveData");
const proxyCommande = require("../../../util/proxy/proxyCommande");

module.exports = {
  guild: true,
  config: { permission: "super_moderateur" },
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Envoie un message de maintenance")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Type de maintenance")
        .setRequired(true)
        .addChoices(
          { name: "Maintenance en Cours", value: "on" },
          { name: "Fin de la Maintenance", value: "off" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Message de status")
        .setRequired(true),
    )
    .addChannelOption((opt) =>
      opt
        .setName("salon")
        .setDescription("Salon où le message de status sera envoyé")
        .addChannelTypes(0, 5)
        .setRequired(false),
    )
    .addRoleOption((opt) =>
      opt.setName("role").setDescription("Rôle mentionné").setRequired(false),
    ),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur, type, message, salon, role } = interaction.parametre;

    const channel = await client.channels.fetch(salon || interaction.channelId);

    const container = new ContainerBuilder()
      .setAccentColor(
        type === "on" ? config.colors.error : config.colors.success,
      )
      .addTextDisplayComponents((t) => t.setContent("## 🚧 Maintenance"))
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) => t.setContent(message))
      .addSeparatorComponents((s) => s)
      .addMediaGalleryComponents((m) =>
        m.addItems((mediaGalleryItem) =>
          mediaGalleryItem.setURL("attachment://status.png"),
        ),
      );

    const imagePath = getAbsolutePath(
      `data/${type === "on" ? "MAINTENANCE_ON.png" : "MAINTENANCE_OFF.png"}`,
    );
    const attachment = new AttachmentBuilder(imagePath, {
      name: "status.png",
    });

    let components = [container];
    if (role) {
      const roleTextDisplay = new TextDisplayBuilder().setContent(
        `<@&${role}>`,
      );
      components = [roleTextDisplay, container];
    }

    const messageMaintenance = await channel.send({
      components,
      files: [attachment],
      flags: MessageFlags.IsComponentsV2,
    });

    const messageLink = `https://discord.com/channels/${messageMaintenance.guildId}/${messageMaintenance.channelId}/${messageMaintenance.id}`;

    const userContainer = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((t) => t.setContent("## 🚧 Maintenance"))
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(`Le message de status a été envoyé ici : ${messageLink}`),
      );

    if (channel.type === "GUILD_NEWS") await messageMaintenance.crosspost();

    let sentMessage;

    if (interaction.isMessageComponent()) {
      sentMessage = await interaction.update({
        components: [userContainer],
        flags: MessageFlags.IsComponentsV2,
        withResponse: true,
      });
    } else {
      sentMessage = await interaction.reply({
        components: [userContainer],
        flags: MessageFlags.IsComponentsV2,
        withResponse: true,
      });
    }

    setTimeout(async () => {
      try {
        await sentMessage.resource.message.delete();
      } catch (error) {}
    }, 10_000);
  },
};
