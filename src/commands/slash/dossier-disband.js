const { getData } = require("../../../util/module/getAndSaveData");
const {
  SlashCommandBuilder,
  ContainerBuilder,
  ActionRowBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
} = require("discord.js");
const proxyCommande = require("../../../util/proxy/proxyCommande");

module.exports = {
  config: { permission: "guide" },
  data: new SlashCommandBuilder()
    .setName("dossier-disband")
    .setDescription("Affiche la liste des dossiers disband")
    .addStringOption((option) =>
      option
        .setName("serveur")
        .setDescription("Le serveur pour lequel afficher les dossiers disband")
        .setRequired(false)
        .setAutocomplete(true),
    ),

  async execute(client, interaction, config) {
    const serveur = await proxyCommande(interaction);
    if (!serveur) return;

    const data = getData(`data/${serveur}/dossierDisband.json`);

    if (!data.length) {
      return interaction.reply({
        content: `Aucun dossier disband n’a été trouvé pour <:NG${
          serveur.charAt(0).toUpperCase() + serveur.slice(1)
        }:${config.emoji[serveur]}> **${
          serveur.charAt(0).toUpperCase() + serveur.slice(1)
        }**.`,
        ephemeral: true,
      });
    }

    const dossierDisbandContainer = new ContainerBuilder()
      .setAccentColor(config.couleur[serveur])
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## Dossiers Disband - ${
            serveur.charAt(0).toUpperCase() + serveur.slice(1)
          }`,
        ),
      )
      .addSeparatorComponents((s) => s);

    for (const entry of data) {
      const pays = entry.rapport?.informations?.nom_pays || entry.pays;
      const chef = entry.rapport?.informations?.chef || "Inconnu";

      dossierDisbandContainer.addTextDisplayComponents((text) =>
        text.setContent(
          `[**${pays}**](https://nationsglory.fr/country/${serveur}/${pays}/) créé par [**${chef}**](https://nationsglory.fr/profile/${chef})`,
        ),
      );
    }

    const menuOptions = data.slice(0, 25).map((entry) => {
      const pays = entry.rapport?.informations?.nom_pays || entry.pays;
      return { label: pays, value: `dossierDisbandDetails-${serveur}-${pays}` };
    });

    dossierDisbandContainer.addSeparatorComponents((s) => s);
    dossierDisbandContainer.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("dossierDisbandDetails")
          .setPlaceholder("Sélectionnez un pays")
          .addOptions(menuOptions),
      ),
    );

    return await interaction.reply({
      components: [dossierDisbandContainer],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
