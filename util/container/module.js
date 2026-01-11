const config = require("../../config");
const { getEmojiTete } = require("../../util/module/emoji");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
} = require("discord.js");

async function Guerre(client, serveur, guerre) {
  if (!guerre)
    guerre = {
      titre: "declaration de guerre empireTibétain vs alaska provocation RP",
      auteur: "pelucasYT",
      date: "1763222880",
      lien: "https://nationsglory.fr/forums/thread/declaration-de-guerre-empiretibetain-vs-alaska-provocation-rp.140577",
    };
  const emoji = await getEmojiTete(client, guerre.auteur);

  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((t) => t.setContent(`## 📍 Nouvelle Guerre`))
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `📌 **Titre :** ${guerre.titre}\n${emoji} **Auteur :** ${guerre.auteur}\n\n*Postée <t:${guerre.date}:R>*`,
      ),
    )
    .addSeparatorComponents((s) => s)
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setURL(guerre.lien)
          .setLabel("🔗 Aller sur la Guerre")
          .setStyle(ButtonStyle.Link),
      ),
    );

  return container;
}

async function Guerrenontraitée(client, serveur, guerre, delaiJour) {
  if (!guerre)
    guerre = {
      titre: "declaration de guerre empireTibétain vs alaska provocation RP",
      auteur: "pelucasYT",
      date: "1763222880",
      lien: "https://nationsglory.fr/forums/thread/declaration-de-guerre-empiretibetain-vs-alaska-provocation-rp.140577",
    };
  if (!delaiJour) delaiJour = 2;
  const emoji = await getEmojiTete(client, guerre.auteur);

  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((t) => t.setContent(`## 🚨 Guerre non traitée`))
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `📌 **Titre :** ${guerre.titre}\n` +
          `${emoji} **Auteur :** ${guerre.auteur}\n\n` +
          `*Postée depuis plus de ${delaiJour} jour${delaiJour > 1 ? "s" : ""}*`,
      ),
    )
    .addSeparatorComponents((s) => s)
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setURL(guerre.lien)
          .setLabel("🔗 Aller sur la Guerre")
          .setStyle(ButtonStyle.Link),
      ),
    );

  return container;
}

async function Plainte(client, serveur, plainte) {
  if (!plainte)
    plainte = {
      titre: "Plainte n°6365 ONU contre freez3r",
      auteur: "yoroka_off",
      date: "1768063680",
      lien: "https://nationsglory.fr/forums/thread/plainte-n6364-onu-contre-freez3r.237636",
    };
  const emoji = await getEmojiTete(client, plainte.auteur);

  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((t) => t.setContent(`## 📍 Nouvelle Plainte`))
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `📌 **Titre :** ${plainte.titre}\n${emoji} **Auteur :** ${plainte.auteur}\n\n*Postée <t:${plainte.date}:R>*`,
      ),
    )
    .addSeparatorComponents((s) => s)
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setURL(plainte.lien)
          .setLabel("🔗 Aller sur la Plainte")
          .setStyle(ButtonStyle.Link),
      ),
    );

  return container;
}

async function Plaintenontraitée(client, serveur, plainte, delaiJour) {
  if (!plainte)
    plainte = {
      titre: "Plainte n°6365 ONU contre freez3r",
      auteur: "yoroka_off",
      date: "1768063680",
      lien: "https://nationsglory.fr/forums/thread/plainte-n6364-onu-contre-freez3r.237636",
    };
  if (!delaiJour) delaiJour = 2;
  const emoji = await getEmojiTete(client, plainte.auteur);

  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((t) => t.setContent(`## 🚨 Plainte non traitée`))
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `📌 **Titre :** ${plainte.titre}\n` +
          `${emoji} **Auteur :** ${plainte.auteur}\n\n` +
          `*Postée depuis plus de ${delaiJour} jour${delaiJour > 1 ? "s" : ""}*`,
      ),
    )
    .addSeparatorComponents((s) => s)
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setURL(plainte.lien)
          .setLabel("🔗 Aller sur la Plainte")
          .setStyle(ButtonStyle.Link),
      ),
    );

  return container;
}

module.exports = { Guerre, Guerrenontraitée, Plainte, Plaintenontraitée };
