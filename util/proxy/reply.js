const {
  MessageFlags,
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const config = require("../../config");

function buildErrorContainer(config, title, description) {
  return new ContainerBuilder()
    .setAccentColor(config.colors.error)
    .addTextDisplayComponents((t) => t.setContent(`## ${title}`))
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) => t.setContent(description));
}

async function sendTemporaryError(interaction, container) {
  if (interaction.isMessageComponent()) {
    const sentMessage = await interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      withResponse: true,
    });

    setTimeout(async () => {
      try {
        await (sentMessage.resource
          ? sentMessage.resource.message.delete()
          : sentMessage.delete());
      } catch {}
    }, 5_000);

    return;
  }

  return interaction.reply({
    components: [container],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  });
}

async function replyOrUpdate(
  interaction,
  components,
  { ephemeral = true, ...extra } = {},
) {
  const payload = {
    components,
    flags: ephemeral
      ? MessageFlags.Ephemeral
      : MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    withResponse: true,
    ...extra,
  };

  return interaction.isMessageComponent()
    ? interaction.update(payload)
    : interaction.reply(payload);
}

function buildLinkRequiredContainer() {
  return buildErrorContainer(
    config,
    "❌ Compte non Lié",
    "Ton compte Discord doit être lié à ton compte NationsGlory pour effectuer cette action.",
  )
    .addSeparatorComponents((s) => s)
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("🔗 Lier son Compte")
          .setURL("https://glorybot.fr/user/profile")
          .setStyle(ButtonStyle.Link),
      ),
    );
}

module.exports = {
  buildLinkRequiredContainer,
  buildErrorContainer,
  sendTemporaryError,
  replyOrUpdate,
};
