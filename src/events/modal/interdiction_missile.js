const {
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const { getServeur } = require("../../../util/module/getServeur");
const { getData, saveData } = require("../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "interdiction_missile",
  },

  async execute(client, interaction, config) {
    const [_, action] = interaction.customId.split("-");

    const serveur = await getServeur(interaction);
    let data = getData(`data/${serveur}/interdiction-missile.json`);

    if (action === "create") {
      const pays = interaction.fields.getTextInputValue("pays");

      const channelContainer = new ContainerBuilder()
        .setAccentColor(config.couleur[serveur])
        .addTextDisplayComponents((t) =>
          t.setContent(
            `## 🚀 Interdiction Missile - ${pays.charAt(0).toUpperCase() + pays.slice(1)}`,
          ),
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            "Ce pays est désormais en interdiction missile, cet-à-dire qui possède des trous ou des résidus de missile. Il n'a donc plus le droit d'envoyer des missiles, ni de faire exploser des TnTs lors d'assauts.",
          ),
        );

      const channel = await client.channels.fetch("743741992730624092");

      const message = await channel.send({
        components: [channelContainer],
        flags: MessageFlags.IsComponentsV2,
      });

      data.push({ nom: pays, message: message.id });
      saveData(`data/${serveur}/interdiction-missile.json`, data);

      const container = new ContainerBuilder()
        .setAccentColor(config.couleur[serveur])
        .addTextDisplayComponents((t) =>
          t.setContent(
            `## 🚀 Interdiction Missile - ${serveur.charAt(0).toUpperCase() + serveur.slice(1)}`,
          ),
        )
        .addSeparatorComponents((s) => s);

      for (const pays of data) {
        container.addSectionComponents((section) =>
          section
            .addTextDisplayComponents((textDisplay) =>
              textDisplay.setContent(`### ${pays.nom}`),
            )
            .setButtonAccessory((button) =>
              button
                .setCustomId(`interdiction_missile-delete-${pays.nom}`)
                .setLabel("Supprimer l'Interdiction Missile")
                .setStyle(ButtonStyle.Danger),
            ),
        );
      }

      if (!data || data.length === 0) {
        container.addTextDisplayComponents((t) =>
          t.setContent(
            "Aucune pays en interdiction missile n’a encore été trouvé",
          ),
        );
      }

      container.addSeparatorComponents((s) => s);
      container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("interdiction_missile-create")
            .setLabel("Ajouter une Interdiction Missile")
            .setStyle(ButtonStyle.Success),
        ),
      );

      interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  },
};
