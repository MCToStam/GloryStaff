module.exports = async (client, interaction) => {
  if (interaction.type === 1) {
    //!Ping
  } else if (interaction.type === 2) {
    //!ApplicationCommand
    if (interaction.commandType === 1) {
      //-ChatInput
      return client.emit("isChatInputCommand", interaction);
    } else if (interaction.commandType === 2) {
      //-User
      return client.emit("isUserContextMenu", interaction);
    } else if (interaction.commandType === 3) {
      //-Message
      return client.emit("isMessageContextMenu", interaction);
    } else if (interaction.commandType === 4) {
      //-PrimaryEntryPoint
      return;
    }
  } else if (interaction.type === 3) {
    //!MessageComponent

    if (interaction.componentType === 1) {
      //-ActionRow
    } else if (interaction.componentType === 2) {
      //-Button
      return client.emit("isButton", interaction);
    } else if (interaction.componentType === 3) {
      //-StringSelect
      return client.emit("isStringSelect", interaction);
    } else if (interaction.componentType === 4) {
      //-TextInput
    } else if (interaction.componentType === 5) {
      //-UserSelect
    } else if (interaction.componentType === 6) {
      //-RoleSelect
      return client.emit("isRoleSelect", interaction);
    } else if (interaction.componentType === 7) {
      //-MentionableSelect
    } else if (interaction.componentType === 8) {
      //-ChannelSelect
      return client.emit("isChannelSelect", interaction);
    }
  } else if (interaction.type === 4) {
    //!ApplicationCommandAutocomplete
    return client.emit("isAutoComplete", interaction);
  } else if (interaction.type === 5) {
    //!ModalSubmit
    return client.emit("isModalSubmit", interaction);
  } else {
    return;
  }
};
