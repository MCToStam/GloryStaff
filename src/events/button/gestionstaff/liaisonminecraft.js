const {
  ModalBuilder,
  LabelBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  data: {
    name: "gestionstaff_liaisonminecraft",
  },

  conf: {
    type: "User",
  },

  async execute(client, interaction, config) {
    const joueur = interaction.customId.split("-")[1];

    const res = await fetch(
      `${config.glorybot_url}/api/get-bedrock?pseudo_ng=${encodeURIComponent(
        joueur,
      )}`,
    );

    let pseudo_mc = null;
    if (res.ok) {
      const data = await res.json();
      pseudo_mc = data.pseudo_mc || null;
    }

    const modal = new ModalBuilder()
      .setCustomId(`gestionstaff_liaisonminecraft-${joueur}`)
      .setTitle(
        pseudo_mc
          ? "Modifier la Liaison Minecraft"
          : "Ajouter une Liaison Minecraft",
      );

    const input = new LabelBuilder()
      .setLabel("Utilisateur Minecraft")
      .setDescription("Choisit l'utilisateur à lier")
      .setTextInputComponent(
        (() => {
          const component = new TextInputBuilder()
            .setCustomId("pseudo_minecraft")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Écrit le pseudonyme à lier")
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(16);

          if (pseudo_mc) component.setValue(pseudo_mc);

          return component;
        })(),
      );

    modal.addLabelComponents(input);

    await interaction.showModal(modal);
  },
};
