const { MessageFlags, ContainerBuilder } = require("discord.js");
const { showAlliancePage } = require("../../../../util/alliance-coral");
const { getData, saveData } = require("../../../../util/module/getAndSaveData");

module.exports = {
  data: {
    name: "modal_alliance_send",
  },

  async execute(client, interaction, config) {
    const data = getData("data/coral/alliance/donnee.json");
    const allianceNom = interaction.customId.replace(
      "modal_alliance_send-",
      "",
    );
    const channelId =
      interaction.fields.getSelectedChannels("channelId")?.first()?.id || false;

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

    const channel = await interaction.client.channels
      .fetch(channelId)
      .catch(() => null);
    if (!channel) {
      const erreurContainer = new ContainerBuilder()
        .setAccentColor(config.errorcolor)
        .addTextDisplayComponents((t) => t.setContent(`## ❌ Erreur`))
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(`Le salon "${channelId}" n'existe pas.`),
        );

      return interaction.reply({
        components: [erreurContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] },
      });
    }

    const chefsMention =
      (Array.isArray(alliance.chef) ? alliance.chef : [alliance.chef])
        .filter(Boolean)
        .map((id) => `<@${id}>`)
        .join(", ") || "Aucun chef";

    const effectifContainer = new ContainerBuilder()
      .setAccentColor(config.couleur["coral"])
      .addTextDisplayComponents((t) =>
        t.setContent(`📜 **Effectif de l’alliance ${alliance.nom}**`),
      )
      .addTextDisplayComponents((t) =>
        t.setContent(`**👑 Chef :** ${chefsMention}`),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `**🌍 Pays Fondateur :** ${
            alliance.listePaysFondateur.join(", ") || "Aucun pays fondateur"
          }\n**🌍 Pays Membre :** ${
            alliance.listePaysMembre.join(", ") || "Aucun pays membre"
          }`,
        ),
      );

    const msg = await channel.send({
      components: [effectifContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] },
    });

    alliance.channelId = channelId;
    alliance.messageId = msg.id;
    saveData("data/coral/alliance/donnee.json", data);

    return await showAlliancePage(
      interaction,
      "coral",
      data,
      allianceNom,
      true,
    );
  },
};
