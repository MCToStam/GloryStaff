const { MessageFlags, ContainerBuilder } = require("discord.js");
const { showAlliancePage } = require("../../../../util/alliance-coral");
const { getData, saveData } = require("../../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "modal_alliance_create",
  },

  async execute(client, interaction, config) {
    const data = getData("data/coral/alliance.donnee.json");
    const nom = interaction.fields.getTextInputValue("nom");
    const chef1 =
      interaction.fields.getSelectedUsers("chef1")?.first()?.id || false;
    const chef2 =
      interaction.fields.getSelectedUsers("chef2")?.first()?.id || false;

    if (data.find((a) => a.nom.toLowerCase() === nom.toLowerCase())) {
      const erreurContainer = new ContainerBuilder()
        .setAccentColor(config.errorcolor)
        .addTextDisplayComponents((t) => t.setContent(`## ❌ Erreur`))
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(`L'alliance "${nom}" n'existe pas.`),
        );

      return interaction.reply({
        components: [erreurContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] },
      });
    }

    const listeChef = [];
    if (chef1) listeChef.push(chef1);
    if (chef2) listeChef.push(chef2);

    data.push({
      nom,
      chef: listeChef,
      listePaysMembre: [],
      listePaysFondateur: [],
    });

    saveData("data/coral/alliance.donnee.json", data);

    return await showAlliancePage(interaction, "coral", data, nom, true);
  },
};
