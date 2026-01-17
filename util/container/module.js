const config = require("../../config");
const { getEmojiTete, getEmojiDrapeau } = require("../../util/module/emoji");
const { discordLink } = require("../../util/module/discordLink");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
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

async function AttenteStaff(client, serveur, joueur, id, salon) {
  if (!joueur) joueur = "ToStam";
  if (!id) id = "719072181631320145";
  if (!salon) salon = "1391047893678293094";

  const pseudo = await discordLink(id);
  const emoji = pseudo ? await getEmojiTete(client, pseudo) : undefined;

  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((t) =>
      t.setContent(
        `## ${emoji || "🕓"} Attente Staff ${
          pseudo ? `- ${pseudo.replace(/_/g, "\\_")}` : ""
        }`,
      ),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `Le joueur **${joueur}** (<@${id}>) attend dans <#${salon}>.`,
      ),
    );

  return container;
}

async function Jail(client, serveur, vraiCriminel, dureeLisible, lien_raison) {
  const buttonEnable = vraiCriminel ? false : true;
  if (!vraiCriminel) vraiCriminel = "ToStam";
  if (!dureeLisible) dureeLisible = "30 minutes";
  if (!lien_raison)
    lien_raison =
      "https://nationsglory.fr/forums/thread/plainte-n6386-onu-contre-ninnin22.237988#answer-453729293094";

  const isLienValide = lien_raison.startsWith(
    "https://nationsglory.fr/forums/thread/",
  );

  let descriptionEmbed = `**Durée** : ${dureeLisible}\n`;
  descriptionEmbed += isLienValide
    ? `**Lien de la plainte :** [Clic Ici](${lien_raison})`
    : `**Raison :** ${lien_raison}`;

  const teteEmoji = await getEmojiTete(client, vraiCriminel);

  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        `## ${teteEmoji || "🚧"} Jail sur ${vraiCriminel.replace(/_/g, "\\_")}`,
      ),
    )
    .addSeparatorComponents((separator) => separator)
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(descriptionEmbed),
    )
    .addSeparatorComponents((separator) => separator)
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("jail_finish")
          .setLabel("✅ Jail Effectué")
          .setStyle(ButtonStyle.Success)
          .setDisabled(buttonEnable),
        ...(isLienValide
          ? [
              new ButtonBuilder()
                .setLabel("🔗 Aller sur la plainte")
                .setStyle(ButtonStyle.Link)
                .setURL(lien_raison),
            ]
          : []),
      ),
    );

  return container;
}

async function Routine(client, serveur, pseudonym) {
  const buttonEnable = pseudonym ? false : true;
  if (!pseudonym) pseudonym = "ToStam";

  const teteEmoji = await getEmojiTete(client, pseudonym);

  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        `## ${teteEmoji || "⏱️"} Routine de ${pseudonym.replace(/_/g, "\\_")}`,
      ),
    )
    .addSeparatorComponents((separator) => separator)
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        `**Début de la routine :** <t:${Math.floor(
          Date.now() / 1000,
        )}:R>\n**Infractions :**\n**Fin de la routine :**`,
      ),
    )
    .addSeparatorComponents((separator) => separator)
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("routine")
          .setPlaceholder("Sélectionnez une infraction")
          .addOptions([
            {
              label: "Bunker Illégal",
              value: "routine_bunkerillegal",
              emoji: "1333876277651705878",
            },
            {
              label: "Anti-AFK",
              value: "routine_antiafk",
              emoji: "1333876277651705878",
            },
            {
              label: "Auto-Clic",
              value: "routine_autoclic",
              emoji: "1333876277651705878",
            },
            {
              label: "Stack Item",
              value: "routine_stackitem",
              emoji: "1333876277651705878",
            },
            {
              label: "AutoNuke Illégal",
              value: "routine_autonukeillegal",
              emoji: "1333876277651705878",
            },
            {
              label: "XRay",
              value: "routine_xray",
              emoji: "1333876277651705878",
            },
            {
              label: "Autre",
              value: "routine_autre",
              emoji: "1333876277651705878",
            },
          ])
          .setDisabled(buttonEnable),
      ),
    )
    .addSeparatorComponents((separator) => separator)
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`routine_finish-${pseudonym}`)
          .setLabel("✅ Terminer la Routine")
          .setStyle(ButtonStyle.Success)
          .setDisabled(buttonEnable),
      ),
    );

  return container;
}

async function ConquêteTerritoriale(client, serveur, pseudo, paysa, paysb) {
  if (!pseudo) pseudo = "ToStam";
  if (!paysa) paysa = "France";
  if (!paysb) paysb = "Allemagne";

  const tete = await getEmojiTete(client, pseudo);
  const drapeauA = await getEmojiDrapeau(client, serveur, paysa);
  const drapeauB = await getEmojiDrapeau(client, serveur, paysb);

  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((t) =>
      t.setContent("## ✈️ Conquête Territoriale"),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `${tete} **${pseudo}** vient de valider la conquête territoriale du pays ${drapeauA || ""} **${paysa}**. Ce pays a donc annexé le pays ${drapeauB || ""} **${paysb}**.`,
      ),
    );

  return container;
}

async function FullBuild(client, serveur, pseudo, paysa, paysb) {
  if (!pseudo) pseudo = "ToStam";
  if (!paysa) paysa = "France";
  if (!paysb) paysb = "Allemagne";

  const tete = await getEmojiTete(client, pseudo);
  const drapeauA = await getEmojiDrapeau(client, serveur, paysa);
  const drapeauB = await getEmojiDrapeau(client, serveur, paysb);

  const container = new ContainerBuilder()
    .setAccentColor(config.couleur[serveur])
    .addTextDisplayComponents((t) => t.setContent("## 🏚️ FullBuild"))
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `${tete} **${pseudo}** vient de valider le fullbuild de pays ${drapeauA || ""} **${paysa}**. Ce pays a donc maintenant la permission de s'étendre sur le pays ${drapeauB || ""} **${paysb}**.`,
      ),
    );

  return container;
}

module.exports = {
  Guerre,
  Guerrenontraitée,
  Plainte,
  Plaintenontraitée,
  AttenteStaff,
  Jail,
  Routine,
  ConquêteTerritoriale,
  FullBuild,
};
