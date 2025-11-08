const { MessageFlags, ContainerBuilder } = require("discord.js");
const {
  showAlliancePage,
  updateAllianceMessage,
} = require("../../../../util/alliance-coral");
const { getData, saveData } = require("../../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "modal_ally_remfonda",
  },

  async execute(client, interaction, config) {
    const data = getData("data/coral/alliance/donnee.json");
    const allianceNom = interaction.customId.replace(
      "modal_ally_remfonda-",
      "",
    );
    const pays = interaction.fields.getTextInputValue("pays").trim();

    const alliance = data.find((a) => a.nom === allianceNom);
    if (!alliance) {
      const erreurContainer = new ContainerBuilder()
        .setAccentColor(config.errorcolor)
        .addTextDisplayComponents((t) => t.setContent(`## ❌ Erreur`))
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(`L'alliance "${allianceNom}" n'existe pas.`),
        );

      return interaction.reply({
        components: [erreurContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] },
      });
    }

    if (!alliance.listePaysFondateur.includes(pays)) {
      const erreurContainer = new ContainerBuilder()
        .setAccentColor(config.errorcolor)
        .addTextDisplayComponents((t) => t.setContent(`## ❌ Erreur`))
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `Le pays "${pays}" ne fait pas parti de l'alliance "${allianceNom}".`,
          ),
        );

      return interaction.reply({
        components: [erreurContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] },
      });
    }

    alliance.listePaysFondateur = alliance.listePaysFondateur.filter(
      (p) => p !== pays,
    );
    saveData("data/coral/alliance/donnee.json", data);

    await updateAllianceMessage(interaction.client, alliance, "coral");
    return await showAlliancePage(
      interaction,
      "coral",
      data,
      allianceNom,
      true,
    );
  },
};
