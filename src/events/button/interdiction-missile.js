const {
  ModalBuilder,
  LabelBuilder,
  TextInputBuilder,
  TextInputStyle,
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
    const [_, action, pays] = interaction.customId.split("-");

    const serveur = await getServeur(interaction);
    let data = getData(`data/${serveur}/interdiction-missile.json`);

    if (action === "delete") {
      const paysData = data.find((p) => p.nom == pays);
      data = data.filter((p) => p.nom !== pays);
      saveData(`data/${serveur}/interdiction-missile.json`, data);

      const channel = await client.channels.fetch("1389999729747824841");
      const message = await channel.messages.fetch(paysData.message);
      await message.delete();

      const container = new ContainerBuilder()
        .setAccentColor(config.serveur[serveur].couleur)
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
    } else if (action === "create") {
      const modal = new ModalBuilder()
        .setCustomId("interdiction_missile-create")
        .setTitle("Créer une alliance");

      const paysInput = new LabelBuilder()
        .setLabel("Nom du Pays")
        .setDescription("Pays à qui attribuer l'interdiction missile")
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("pays")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Entrer le nom...")
            .setRequired(true)
            .setMaxLength(100),
        );

      modal.addLabelComponents(paysInput);

      interaction.showModal(modal);
    }
  },
};
