const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ContainerBuilder,
  UserSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  LabelBuilder,
  ChannelType,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("../config");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isButton() && !interaction.isModalSubmit()) return;

    const serveur = "coral";
    const filePath = path.join(
      __dirname,
      "..",
      "data",
      serveur,
      "alliance",
      "donnee.json"
    );

    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "[]", "utf-8");
    let data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    if (
      interaction.isButton() &&
      interaction.customId.startsWith("ally_editchef_")
    ) {
      const allianceNom = interaction.customId.replace("ally_editchef_", "");
      const alliance = data.find((a) => a.nom === allianceNom);

      const modal = new ModalBuilder()
        .setCustomId(`modal_ally_editchef_${allianceNom}`)
        .setTitle(`Modifier le chef de ${allianceNom}`);

      const chef1 = new LabelBuilder()
        .setLabel("Sélectionne un Utilisateur")
        .setDescription("Chef 1 de l'alliance ( optionnel )")
        .setUserSelectMenuComponent(
          new UserSelectMenuBuilder()
            .setCustomId("chef1")
            .setPlaceholder("Sélectionne un utilisateur...")
            .setRequired(false)
            .setMaxValues(1)
            .setDefaultUsers(alliance.chef[0] ? [alliance.chef[0]] : [])
        );

      const chef2 = new LabelBuilder()
        .setLabel("Sélectionne un Utilisateur")
        .setDescription("Chef 2 de l'alliance ( optionnel )")
        .setUserSelectMenuComponent(
          new UserSelectMenuBuilder()
            .setCustomId("chef2")
            .setPlaceholder("Sélectionne un utilisateur...")
            .setRequired(false)
            .setMaxValues(1)
            .setDefaultUsers(alliance.chef[1] ? [alliance.chef[1]] : [])
        );

      modal.addLabelComponents(chef1, chef2);

      return interaction.showModal(modal);
    }

    if (
      interaction.isModalSubmit() &&
      interaction.customId.startsWith("modal_ally_editchef_")
    ) {
      const allianceNom = interaction.customId.replace(
        "modal_ally_editchef_",
        ""
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
            t.setContent(`L'alliance "${allianceNom}" n'existe pas.`)
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
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      await updateAllianceMessage(interaction.client, alliance, serveur);

      return await showAlliancePage(
        interaction,
        serveur,
        data,
        allianceNom,
        true
      );
    }

    if (interaction.isButton() && interaction.customId === "alliance_create") {
      const modal = new ModalBuilder()
        .setCustomId("modal_alliance_create")
        .setTitle("Créer une alliance");

      const nomInput = new LabelBuilder()
        .setLabel("Nom de l'Alliance")
        .setDescription("Le nom de l'alliance à attribuer")
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("nom")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Entrer le nom...")
            .setRequired(true)
            .setMaxLength(100)
        );

      const chef1 = new LabelBuilder()
        .setLabel("Sélectionne un Utilisateur")
        .setDescription("Chef 1 de l'alliance ( optionnel )")
        .setUserSelectMenuComponent(
          new UserSelectMenuBuilder()
            .setCustomId("chef1")
            .setPlaceholder("Sélectionne un utilisateur...")
            .setRequired(false)
            .setMaxValues(1)
        );

      const chef2 = new LabelBuilder()
        .setLabel("Sélectionne un Utilisateur")
        .setDescription("Chef 2 de l'alliance ( optionnel )")
        .setUserSelectMenuComponent(
          new UserSelectMenuBuilder()
            .setCustomId("chef2")
            .setPlaceholder("Sélectionne un utilisateur...")
            .setRequired(false)
            .setMaxValues(1)
        );

      modal.addLabelComponents(nomInput, chef1, chef2);

      return interaction.showModal(modal);
    }

    if (
      interaction.isModalSubmit() &&
      interaction.customId === "modal_alliance_create"
    ) {
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
            t.setContent(`L'alliance "${nom}" n'existe pas.`)
          );

        return interaction.reply({
          components: [erreurContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        });
      }

      listeChef = [];
      if (chef1) listeChef.push(chef1);
      if (chef2) listeChef.push(chef2);

      data.push({
        nom,
        chef: listeChef,
        listePaysMembre: [],
        listePaysFondateur: [],
      });

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      return await showAlliancePage(interaction, serveur, data, nom, true);
    }

    if (
      interaction.isButton() &&
      interaction.customId.startsWith("ally_addfonda_")
    ) {
      const allianceNom = interaction.customId.replace("ally_addfonda_", "");

      const modal = new ModalBuilder()
        .setCustomId(`modal_ally_addfonda_${allianceNom}`)
        .setTitle(`Ajouter un pays à ${allianceNom}`);

      const paysInput = new TextInputBuilder()
        .setCustomId("pays")
        .setLabel("Nom du pays à ajouter")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(paysInput));
      return interaction.showModal(modal);
    }

    if (
      interaction.isModalSubmit() &&
      interaction.customId.startsWith("modal_ally_addfonda_")
    ) {
      const allianceNom = interaction.customId.replace(
        "modal_ally_addfonda_",
        ""
      );
      const pays = interaction.fields.getTextInputValue("pays").trim();

      const alliance = data.find((a) => a.nom === allianceNom);
      if (!alliance) {
        const erreurContainer = new ContainerBuilder()
          .setAccentColor(config.errorcolor)
          .addTextDisplayComponents((t) => t.setContent(`## ❌ Erreur`))
          .addSeparatorComponents((s) => s)
          .addTextDisplayComponents((t) =>
            t.setContent(`L'alliance "${allianceNom}" n'existe pas.`)
          );

        return interaction.reply({
          components: [erreurContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        });
      }

      if (alliance.listePaysFondateur.includes(pays)) {
        const erreurContainer = new ContainerBuilder()
          .setAccentColor(config.errorcolor)
          .addTextDisplayComponents((t) => t.setContent(`## ❌ Erreur`))
          .addSeparatorComponents((s) => s)
          .addTextDisplayComponents((t) =>
            t.setContent(
              `Le pays "${pays}" fait déjà parti de l'alliance "${allianceNom}".`
            )
          );

        return interaction.reply({
          components: [erreurContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        });
      }

      alliance.listePaysFondateur.push(pays);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      await updateAllianceMessage(interaction.client, alliance, serveur);
      return await showAlliancePage(
        interaction,
        serveur,
        data,
        allianceNom,
        true
      );
    }

    if (
      interaction.isButton() &&
      interaction.customId.startsWith("ally_remfonda_")
    ) {
      const allianceNom = interaction.customId.replace("ally_remfonda_", "");

      const modal = new ModalBuilder()
        .setCustomId(`modal_ally_remfonda_${allianceNom}`)
        .setTitle(`Retirer un pays de ${allianceNom}`);

      const paysInput = new TextInputBuilder()
        .setCustomId("pays")
        .setLabel("Nom du pays à retirer")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(paysInput));
      return interaction.showModal(modal);
    }

    if (
      interaction.isModalSubmit() &&
      interaction.customId.startsWith("modal_ally_remfonda_")
    ) {
      const allianceNom = interaction.customId.replace(
        "modal_ally_remfonda_",
        ""
      );
      const pays = interaction.fields.getTextInputValue("pays").trim();

      const alliance = data.find((a) => a.nom === allianceNom);
      if (!alliance) {
        const erreurContainer = new ContainerBuilder()
          .setAccentColor(config.errorcolor)
          .addTextDisplayComponents((t) => t.setContent(`## ❌ Erreur`))
          .addSeparatorComponents((s) => s)
          .addTextDisplayComponents((t) =>
            t.setContent(`L'alliance "${allianceNom}" n'existe pas.`)
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
              `Le pays "${pays}" ne fait pas parti de l'alliance "${allianceNom}".`
            )
          );

        return interaction.reply({
          components: [erreurContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        });
      }

      alliance.listePaysFondateur = alliance.listePaysFondateur.filter(
        (p) => p !== pays
      );
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      await updateAllianceMessage(interaction.client, alliance, serveur);
      return await showAlliancePage(
        interaction,
        serveur,
        data,
        allianceNom,
        true
      );
    }

    if (
      interaction.isButton() &&
      interaction.customId.startsWith("ally_addmember_")
    ) {
      const allianceNom = interaction.customId.replace("ally_addmember_", "");

      const modal = new ModalBuilder()
        .setCustomId(`modal_ally_addmember_${allianceNom}`)
        .setTitle(`Ajouter un pays à ${allianceNom}`);

      const paysInput = new TextInputBuilder()
        .setCustomId("pays")
        .setLabel("Nom du pays à ajouter")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(paysInput));
      return interaction.showModal(modal);
    }

    if (
      interaction.isModalSubmit() &&
      interaction.customId.startsWith("modal_ally_addmember_")
    ) {
      const allianceNom = interaction.customId.replace(
        "modal_ally_addmember_",
        ""
      );
      const pays = interaction.fields.getTextInputValue("pays").trim();

      const alliance = data.find((a) => a.nom === allianceNom);
      if (!alliance) {
        const erreurContainer = new ContainerBuilder()
          .setAccentColor(config.errorcolor)
          .addTextDisplayComponents((t) => t.setContent(`## ❌ Erreur`))
          .addSeparatorComponents((s) => s)
          .addTextDisplayComponents((t) =>
            t.setContent(`L'alliance "${allianceNom}" n'existe pas.`)
          );

        return interaction.reply({
          components: [erreurContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        });
      }

      if (alliance.listePaysMembre.includes(pays)) {
        const erreurContainer = new ContainerBuilder()
          .setAccentColor(config.errorcolor)
          .addTextDisplayComponents((t) => t.setContent(`## ❌ Erreur`))
          .addSeparatorComponents((s) => s)
          .addTextDisplayComponents((t) =>
            t.setContent(
              `Le pays "${pays}" fait déjà parti de l'alliance "${allianceNom}".`
            )
          );

        return interaction.reply({
          components: [erreurContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        });
      }

      alliance.listePaysMembre.push(pays);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      await updateAllianceMessage(interaction.client, alliance, serveur);
      return await showAlliancePage(
        interaction,
        serveur,
        data,
        allianceNom,
        true
      );
    }

    if (
      interaction.isButton() &&
      interaction.customId.startsWith("ally_remmember_")
    ) {
      const allianceNom = interaction.customId.replace("ally_remmember_", "");

      const modal = new ModalBuilder()
        .setCustomId(`modal_ally_remmember_${allianceNom}`)
        .setTitle(`Retirer un pays de ${allianceNom}`);

      const paysInput = new TextInputBuilder()
        .setCustomId("pays")
        .setLabel("Nom du pays à retirer")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(paysInput));
      return interaction.showModal(modal);
    }

    if (
      interaction.isModalSubmit() &&
      interaction.customId.startsWith("modal_ally_remmember_")
    ) {
      const allianceNom = interaction.customId.replace(
        "modal_ally_remmember_",
        ""
      );
      const pays = interaction.fields.getTextInputValue("pays").trim();

      const alliance = data.find((a) => a.nom === allianceNom);
      if (!alliance) {
        const erreurContainer = new ContainerBuilder()
          .setAccentColor(config.errorcolor)
          .addTextDisplayComponents((t) => t.setContent(`## ❌ Erreur`))
          .addSeparatorComponents((s) => s)
          .addTextDisplayComponents((t) =>
            t.setContent(`L'alliance "${allianceNom}" n'existe pas.`)
          );

        return interaction.reply({
          components: [erreurContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        });
      }

      if (!alliance.listePaysMembre.includes(pays)) {
        const erreurContainer = new ContainerBuilder()
          .setAccentColor(config.errorcolor)
          .addTextDisplayComponents((t) => t.setContent(`## ❌ Erreur`))
          .addSeparatorComponents((s) => s)
          .addTextDisplayComponents((t) =>
            t.setContent(
              `Le pays "${pays}" ne fait pas parti de l'alliance "${allianceNom}".`
            )
          );

        return interaction.reply({
          components: [erreurContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        });
      }

      alliance.listePaysMembre = alliance.listePaysMembre.filter(
        (p) => p !== pays
      );
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      await updateAllianceMessage(interaction.client, alliance, serveur);
      return await showAlliancePage(
        interaction,
        serveur,
        data,
        allianceNom,
        true
      );
    }

    if (
      interaction.isButton() &&
      interaction.customId.startsWith("alliance_edit_")
    ) {
      const allianceNom = interaction.customId.replace("alliance_edit_", "");
      return await showAlliancePage(
        interaction,
        serveur,
        data,
        allianceNom,
        true
      );
    }

    if (
      interaction.isButton() &&
      interaction.customId.startsWith("alliance_send_")
    ) {
      const allianceNom = interaction.customId.replace("alliance_send_", "");

      const modal = new ModalBuilder()
        .setCustomId(`modal_alliance_send_${allianceNom}`)
        .setTitle("Envoyer l’effectif de l’alliance");

      const channelInput = new LabelBuilder()
        .setLabel("Salon ou Fil du serveur")
        .setDescription("Le salon où sera envoyé l'effectif")
        .setChannelSelectMenuComponent(
          new ChannelSelectMenuBuilder()
            .setCustomId("channelId")
            .setPlaceholder("Sélectionne un salon...")
            .setRequired(true)
            .setMaxValues(1)
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.GuildAnnouncement,
              ChannelType.PublicThread,
              ChannelType.PrivateThread
            )
        );

      modal.addLabelComponents(channelInput);

      return interaction.showModal(modal);
    }

    if (
      interaction.isModalSubmit() &&
      interaction.customId.startsWith("modal_alliance_send_")
    ) {
      const allianceNom = interaction.customId.replace(
        "modal_alliance_send_",
        ""
      );
      const channelId = interaction.fields.getSelectedChannels("channelId")?.first()?.id || false;

      const alliance = data.find((a) => a.nom === allianceNom);
      if (!alliance) {
        const erreurContainer = new ContainerBuilder()
          .setAccentColor(config.errorcolor)
          .addTextDisplayComponents((t) => t.setContent(`## ❌ Erreur`))
          .addSeparatorComponents((s) => s)
          .addTextDisplayComponents((t) =>
            t.setContent(`L'alliance "${allianceNom}" n'existe pas.`)
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
            t.setContent(`Le salon "${channelId}" n'existe pas.`)
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
        .setAccentColor(config.couleur[serveur])
        .addTextDisplayComponents((t) =>
          t.setContent(`📜 **Effectif de l’alliance ${alliance.nom}**`)
        )
        .addTextDisplayComponents((t) =>
          t.setContent(`**👑 Chef :** ${chefsMention}`)
        )
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `**🌍 Pays Fondateur :** ${
              alliance.listePaysFondateur.join(", ") || "Aucun pays fondateur"
            }\n**🌍 Pays Membre :** ${
              alliance.listePaysMembre.join(", ") || "Aucun pays membre"
            }`
          )
        );

      const msg = await channel.send({
        components: [effectifContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [] },
      });

      alliance.channelId = channelId;
      alliance.messageId = msg.id;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      return await showAlliancePage(
        interaction,
        serveur,
        data,
        allianceNom,
        true
      );
    }

    if (
      interaction.isButton() &&
      interaction.customId.startsWith("alliance_delete_")
    ) {
      const allianceNom = interaction.customId.replace("alliance_delete_", "");
      data = data.filter((a) => a.nom !== allianceNom);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      return await showAllianceList(interaction, serveur, data);
    }
  },
};

async function showAllianceList(interaction, serveur, data) {
  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((t) =>
      t.setContent(
        `## Alliance - ${serveur.charAt(0).toUpperCase() + serveur.slice(1)}`
      )
    )
    .addSeparatorComponents((s) => s);

  for (const alliance of data) {
    const chefsMention =
      (Array.isArray(alliance.chef) ? alliance.chef : [alliance.chef])
        .filter(Boolean)
        .map((id) => `<@${id}>`)
        .join(", ") || "Aucun chef";
    container.addSectionComponents((section) =>
      section
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            `### ${
              alliance.nom
            }\n👑 Chef : ${chefsMention}\n**🌍 Pays Fondateur :** ${
              alliance.listePaysFondateur.join(", ") || "Aucun pays fondateur"
            }\n**🌍 Pays Membre :** ${
              alliance.listePaysMembre.join(", ") || "Aucun pays membre"
            }`
          )
        )
        .setButtonAccessory((button) =>
          button
            .setCustomId(`alliance_edit_${alliance.nom}`)
            .setLabel("Modifier")
            .setStyle(ButtonStyle.Primary)
        )
    );
  }

  if (!data || data.length === 0) {
    container.addTextDisplayComponents((t) =>
      t.setContent("Aucune alliance n’a encore été créée")
    );
  }

  container.addSeparatorComponents((s) => s);
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("alliance_create")
        .setLabel("Créer une alliance")
        .setStyle(ButtonStyle.Success)
    )
  );

  if (interaction.replied || interaction.deferred) {
    return interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  } else {
    return interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  }
}

async function showAlliancePage(
  interaction,
  serveur,
  data,
  allianceNom,
  adminMode = false
) {
  const alliance = data.find((a) => a.nom === allianceNom);
  if (!alliance) {
    const erreurContainer = new ContainerBuilder()
      .setAccentColor(config.errorcolor)
      .addTextDisplayComponents((t) => t.setContent(`## ❌ Erreur`))
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(`L'alliance "${allianceNom}" n'existe pas.`)
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

  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((t) =>
      t.setContent(
        `## Alliance - ${
          alliance.nom
        }\n👑 Chef : ${chefsMention}\n**🌍 Pays Fondateur :** ${
          alliance.listePaysFondateur.join(", ") || "Aucun pays fondateur"
        }\n**🌍 Pays Membre :** ${
          alliance.listePaysMembre.join(", ") || "Aucun pays membre"
        }`
      )
    )
    .addSeparatorComponents((s) => s);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ally_addmember_${alliance.nom}`)
      .setLabel("Ajouter un pays membre")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`ally_remmember_${alliance.nom}`)
      .setLabel("Retirer un pays membre")
      .setStyle(ButtonStyle.Danger)
  );

  container.addActionRowComponents(row);

  if (adminMode) {
    const adminRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`alliance_send_${alliance.nom}`)
        .setLabel("Envoyer l'effectif")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`ally_editchef_${alliance.nom}`)
        .setLabel("Modifier le(s) chef(s)")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`alliance_delete_${alliance.nom}`)
        .setLabel("Supprimer l'alliance")
        .setStyle(ButtonStyle.Danger)
    );

    const adminRow2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ally_addfonda_${alliance.nom}`)
        .setLabel("Ajouter un pays fondateur")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`ally_remfonda_${alliance.nom}`)
        .setLabel("Retirer un pays fondateur")
        .setStyle(ButtonStyle.Danger)
    );

    container.addActionRowComponents(adminRow);
    container.addActionRowComponents(adminRow2);
  }

  if (interaction.replied || interaction.deferred) {
    return interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] },
    });
  } else {
    return interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  }
}

async function updateAllianceMessage(client, alliance, serveur) {
  if (!alliance.channelId || !alliance.messageId) return;
  const channel = await client.channels
    .fetch(alliance.channelId)
    .catch(() => null);
  if (!channel) return;

  const msg = await channel.messages
    .fetch(alliance.messageId)
    .catch(() => null);
  if (!msg) return;

  const chefsMention =
    (Array.isArray(alliance.chef) ? alliance.chef : [alliance.chef])
      .filter(Boolean)
      .map((id) => `<@${id}>`)
      .join(", ") || "Aucun chef";

  const effectifContainer = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((t) =>
      t.setContent(`📜 **Effectif de l’alliance ${alliance.nom}**`)
    )
    .addTextDisplayComponents((t) =>
      t.setContent(`**👑 Chef :** ${chefsMention}`)
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `**🌍 Pays Fondateur :** ${
          alliance.listePaysFondateur.join(", ") || "Aucun pays fondateur"
        }\n**🌍 Pays Membre :** ${
          alliance.listePaysMembre.join(", ") || "Aucun pays membre"
        }`
      )
    );

  await msg.edit({
    components: [effectifContainer],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  });
}
