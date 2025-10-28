const { MessageFlags, ContainerBuilder } = require("discord.js");
const {
  showAlliancePage,
  updateAllianceMessage,
} = require("../../../../util/alliance-coral");
const { getData, saveData } = require("../../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "modal_ally_editchef",
  },

  async execute(client, interaction, config) {
    const data = getData("data/coral/alliance.donnee.json");
    const allianceNom = interaction.customId.replace(
      "modal_ally_editchef-",
      "",
    );
    const chef1 =
      interaction.fields.getSelectedUsers("chef1")?.first()?.id || false;
    const chef2 =
      interaction.fields.getSelectedUsers("chef2")?.first()?.id || false;

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

    alliance.chef = [];
    if (chef1) alliance.chef.push(chef1);
    if (chef2) alliance.chef.push(chef2);
    saveData("data/coral/alliance.donnee.json", data);

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
