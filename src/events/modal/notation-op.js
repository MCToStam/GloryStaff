const { ContainerBuilder, MessageFlags } = require("discord.js");
const { getEmojiDrapeau, getEmojiTete } = require("../../../util/module/emoji");

module.exports = {
  data: {
    name: "qui_note_pays",
  },

  async execute(client, interaction, config) {
    const id = interaction.customId.slice("qui_note_pays-".length);
    const paysSaisi = interaction.fields
      .getTextInputValue("nom-pays")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");

    let color = interaction.message.components[0].data.accent_color;
    if (!color) {
      color = interaction.message.components[1].data.accent_color;
    }

    const serveur = Object.keys(config.couleur).find((key) => {
      const hexValue = config.couleur[key];
      const decimalValue =
        typeof hexValue === "string" ? parseInt(hexValue, 16) : hexValue;
      return decimalValue === color;
    });

    await interaction.deferReply({ ephemeral: true });
    const response = await fetch(
      `${config.glorybot_url}/api/notation?semaine=${id}&pays=${paysSaisi}&serveur=${serveur}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.glorybot_token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    const staff = data?.staff || false;

    if (staff) {
      const createdEmojis = [];
      let emojiPays;
      let emojiStaff;

      try {
        emojiPays = await getEmojiDrapeau(
          client,
          serveur,
          data.pays.toLowerCase(),
        );
        if (emojiPays) createdEmojis.push(emojiPays);

        emojiStaff = await getEmojiTete(client, staff.toLowerCase());
        if (emojiStaff) createdEmojis.push(emojiStaff);
      } catch (e) {
        console.log(
          "Erreur lors de la création des émojis de qui note mon pays :",
          e,
        );
      }

      const informationContainer = new ContainerBuilder()
        .setAccentColor(config.couleur[serveur])
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent("## Pays Noté"),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            `Les notations du pays <:${emojiPays.name}:${emojiPays.id}> "**${data.pays}**" ont été faites par <:${emojiStaff.name}:${emojiStaff.id}> **${staff}**.`,
          ),
        );

      await interaction.editReply({
        components: [informationContainer],
        flags: MessageFlags.IsComponentsV2,
        ephemeral: true,
      });

      for (const emoji of createdEmojis) {
        try {
          await emoji.delete();
        } catch (err) {
          console.error(
            `❌ Impossible de supprimer l'émoji ${emoji.name} :`,
            err,
          );
        }
      }
    } else {
      const informationContainer = new ContainerBuilder()
        .setAccentColor(config.errorcolor)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent("## Erreur"),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            `Le pays "**${paysSaisi}**" n'existe pas, a mal été orthographié ou n'a pas été noté cette semaine.`,
          ),
        );

      await interaction.editReply({
        components: [informationContainer],
        flags: MessageFlags.IsComponentsV2,
        ephemeral: true,
      });
    }
    return;
  },
};
