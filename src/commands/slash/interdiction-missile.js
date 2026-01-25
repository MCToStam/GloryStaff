const { getData } = require("../../../util/module/getAndSaveData");
const proxyCommande = require("../../../util/proxy/proxyCommande");
const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  serveur: ["521060626211012630"],
  config: { permission: "super_moderateur" },
  data: new SlashCommandBuilder()
    .setName("interdiction-missile")
    .setDescription("Ajoute et supprime des interdictions-missiles"),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },
  async proxy(client, interaction, config) {
    const { serveur } = interaction.parametre;

    const data = getData(`data/${serveur}/interdiction-missile.json`);

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

    if (interaction.isMessageComponent()) {
      return interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } else {
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  },
};
