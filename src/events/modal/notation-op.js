const { ContainerBuilder, MessageFlags } = require("discord.js");
const { getEmojiDrapeau, getEmojiTete } = require("../../../util/module/emoji");
const { getServeur } = require("../../../util/module/getServeur");

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

    const serveur = await getServeur(interaction);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
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
      const emojiPays =
        (await getEmojiDrapeau(client, serveur, data.pays)) || "🏳️";

      const emojiStaff =
        (await getEmojiTete(client, staff)) ||
        "<:tete_default:1517896405841215619>";

      const informationContainer = new ContainerBuilder()
        .setAccentColor(config.serveur[serveur].couleur)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent("## Pays Noté"),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            `Les notations du pays ${emojiPays} "**${
              data.pays
            }**" ont été faites par ${emojiStaff}**${staff}**.`,
          ),
        );

      await interaction.editReply({
        components: [informationContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    } else {
      const informationContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)
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
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }
  },
};
