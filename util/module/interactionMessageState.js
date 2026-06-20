const messageVersions = new Map();

function createVersionToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function trackInteractionMessage(interaction) {
  const message =
    interaction.message ||
    (typeof interaction.fetchReply === "function"
      ? await interaction.fetchReply().catch(() => null)
      : null);

  if (!message?.id) {
    return null;
  }

  const tracker = {
    messageId: message.id,
    token: createVersionToken(),
  };

  messageVersions.set(tracker.messageId, tracker.token);
  return tracker;
}

function isTrackedMessageCurrent(tracker) {
  if (!tracker?.messageId || !tracker?.token) {
    return false;
  }

  return messageVersions.get(tracker.messageId) === tracker.token;
}

async function editReplyIfCurrent(interaction, tracker, payload) {
  if (!isTrackedMessageCurrent(tracker)) {
    return false;
  }

  await interaction.editReply(payload);

  return isTrackedMessageCurrent(tracker);
}

async function respondThenEditWithTracking(
  interaction,
  { initialPayload, resolveUpdatedPayload, respond },
) {
  await respond(initialPayload);

  const tracker = await trackInteractionMessage(interaction);

  void (async () => {
    const updatedPayload = await resolveUpdatedPayload();

    if (!updatedPayload) {
      return;
    }

    await editReplyIfCurrent(interaction, tracker, updatedPayload);
  })();

  return tracker;
}

module.exports = {
  respondThenEditWithTracking,
  trackInteractionMessage,
  isTrackedMessageCurrent,
  editReplyIfCurrent,
};
