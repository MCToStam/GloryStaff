const config = require("../../config");
const { getEmojiTete, getEmojiDrapeau } = require("../../util/module/emoji");
const { getAbsolutePath } = require("../../util/module/getAndSaveData");
const { discordLink } = require("../../util/module/discordLink");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ContainerBuilder,
  MediaGalleryBuilder,
  AttachmentBuilder,
} = require("discord.js");
const CONFIG_STATIC = require("../../util/config");

function parseHeureONU(dateStr) {
  const joursMap = {
    Dimanche: 0,
    Lundi: 1,
    Mardi: 2,
    Mercredi: 3,
    Jeudi: 4,
    Vendredi: 5,
    Samedi: 6,
  };

  const [jourStr, heureStrPart] = dateStr.split(" ");
  const [heureStr, minuteStr] = heureStrPart.split("h");

  const heure = Number(heureStr);
  const minute = Number(minuteStr);

  return {
    jour: joursMap[jourStr],
    heure,
    minute,
    heureStr: heureStr.padStart(2, "0"),
    minuteStr: minuteStr.padStart(2, "0"),
    jourStr,
  };
}

function formatDuree(duree) {
  if (!duree) return "";
  return duree.replace(/(\d+)(y|mois|j|h|m|s)/g, (_, value, unit) => {
    const map = {
      y: { sing: "an", plur: "ans" },
      mois: { sing: "mois", plur: "mois" },
      j: { sing: "jour", plur: "jours" },
      h: { sing: "heure", plur: "heures" },
      m: { sing: "minute", plur: "minutes" },
      s: { sing: "seconde", plur: "secondes" },
    };
    const u = map[unit];
    return u ? `${value} ${value > 1 ? u.plur : u.sing}` : `${value}${unit}`;
  });
}

async function Guerre(client, serveur, guerre) {
  if (!guerre)
    guerre = {
      titre: "declaration de guerre empireTibétain vs alaska provocation RP",
      auteur: "pelucasYT",
      date: "1763222880",
      lien: "https://nationsglory.fr/forums/thread/declaration-de-guerre-empiretibetain-vs-alaska-provocation-rp.140577",
    };
  const emoji = (await getEmojiTete(client, guerre.auteur)) || "🧑";

  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
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

  const components = [container];

  return { components, files: [] };
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
  const emoji = (await getEmojiTete(client, guerre.auteur)) || "🧑";

  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
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

  const components = [container];

  return { components, files: [] };
}

async function Plainte(client, serveur, plainte) {
  if (!plainte)
    plainte = {
      titre: "Plainte n°6365 ONU contre freez3r",
      auteur: "yoroka_off",
      date: "1768063680",
      lien: "https://nationsglory.fr/forums/thread/plainte-n6364-onu-contre-freez3r.237636",
    };
  const emoji = (await getEmojiTete(client, plainte.auteur)) || "🧑";

  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
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

  const components = [container];

  return { components, files: [] };
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
  const emoji = (await getEmojiTete(client, plainte.auteur)) || "🧑";

  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
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

  const components = [container];

  return { components, files: [] };
}

async function AttenteStaff(client, serveur, joueur, id) {
  if (!joueur) joueur = "ToStam";
  if (!id) id = "719072181631320145";

  const pseudo = await discordLink(id);
  const emoji = pseudo
    ? (await getEmojiTete(client, pseudo)) || "🧑"
    : undefined;

  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
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
        `Le joueur **${joueur}** (<@${id}>) attend dans <#${config.serveur[serveur].attenteStaff}>.`,
      ),
    );

  const components = [container];

  return { components, files: [] };
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

  const teteEmoji = (await getEmojiTete(client, vraiCriminel)) || "🚧";

  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        `## ${teteEmoji} Jail sur ${vraiCriminel.replace(/_/g, "\\_")}`,
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

  const components = [container];

  return { components, files: [] };
}

async function Routine(client, serveur, pseudonym, emoji) {
  const buttonEnable = pseudonym ? false : true;
  if (!pseudonym) pseudonym = "ToStam";

  const teteEmoji = emoji || "⏱️";

  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        `## ${teteEmoji} Routine de ${pseudonym.replace(/_/g, "\\_")}`,
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

  const components = [container];

  return { components, files: [] };
}

async function ConquêteTerritoriale(client, serveur, pseudo, paysa, paysb) {
  if (!pseudo) pseudo = "ToStam";
  if (!paysa) paysa = "France";
  if (!paysb) paysb = "Allemagne";

  const tete = (await getEmojiTete(client, pseudo)) || "🧑";
  const drapeauA = (await getEmojiDrapeau(client, serveur, paysa)) || "🏳️";
  const drapeauB = (await getEmojiDrapeau(client, serveur, paysb)) || "🏳️";

  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
    .addTextDisplayComponents((t) =>
      t.setContent("## ✈️ Conquête Territoriale"),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `${tete} **${pseudo}** vient de valider la conquête territoriale du pays ${drapeauA || ""} **${paysa}**. Ce pays a donc annexé le pays ${drapeauB || ""} **${paysb}**.`,
      ),
    );

  const components = [container];

  return { components, files: [] };
}

async function FullBuild(client, serveur, pseudo, paysa, paysb) {
  if (!pseudo) pseudo = "ToStam";
  if (!paysa) paysa = "France";
  if (!paysb) paysb = "Allemagne";

  const tete = (await getEmojiTete(client, pseudo)) || "🧑";
  const drapeauA = (await getEmojiDrapeau(client, serveur, paysa)) || "🏳️";
  const drapeauB = (await getEmojiDrapeau(client, serveur, paysb)) || "🏳️";

  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
    .addTextDisplayComponents((t) => t.setContent("## 🏚️ FullBuild"))
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `${tete} **${pseudo}** vient de valider le fullbuild de pays ${drapeauA || ""} **${paysa}**. Ce pays a donc maintenant la permission de s'étendre sur le pays ${drapeauB || ""} **${paysb}**.`,
      ),
    );

  const components = [container];

  return { components, files: [] };
}

async function SanctionStaff(client, serveur, pseudonyme, newSanctions) {
  if (!pseudonyme) pseudonyme = "ToStam";
  if (!newSanctions)
    newSanctions = [
      {
        type: "Warn",
        duree: "Def",
        raison: "Utilisation abusive d une autre langue",
        staff: "Noah181006",
        date: "2024-01-21 15:44:42",
        serveur: "orange",
      },
    ];

  const lignes = await Promise.all(
    newSanctions.map(async (s) => {
      const ts = s.date
        ? `<t:${Math.floor(new Date(s.date).getTime() / 1000)}:R>`
        : "";

      const dureeStr =
        s.type !== "Warn" && s.duree === "Def"
          ? "définitif "
          : s.type !== "Warn" && s.duree
            ? `pendant ${formatDuree(s.duree)} `
            : "";

      const tete = (await getEmojiTete(client, s.staff)) || "🧑";

      return `${config.serveur[s.serveur].emoji_formate} **${
        s.type
      }** ${dureeStr}pour **${s.raison}** par ${tete} **${s.staff}** ${ts}`;
    }),
  );

  const message = `**${
    (await getEmojiTete(client, pseudonyme)) || "🧑"
  } ${pseudonyme}** a reçu ${newSanctions.length} ${
    newSanctions.length > 1 ? "nouvelles sanctions" : "nouvelle sanction"
  } :\n\n${lignes.join("\n")}`;

  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `## 🔨 ${newSanctions.length > 1 ? "Nouvelles Sanctions" : "Nouvelle Sanction"}`,
      ),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) => t.setContent(message));

  const components = [container];

  return { components, files: [] };
}

async function Alerte(client, serveur) {
  const dataONU = CONFIG_STATIC.find((c) => c.nom === "ONU").systeme.Alerte;
  const { jour, heure, minute, heureStr, minuteStr, jourStr } = parseHeureONU(
    dataONU.Heure[serveur],
  );

  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
    .addTextDisplayComponents((t) =>
      t.setContent(`## 🌐 ONU ${config.serveur[serveur].nom}`),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `L’**ONU** est une **réunion hebdomadaire** entre le staff et les joueurs ! Ce rendez-vous permet de faire des rappels, annoncer les nouveautés, les rank ainsi que de faire des pubs, des demandes de missiles, d’autonuke et de poser toutes les questions qui vous titillent. Afin de participer à l'ONU, il vous suffit de rejoindre le **[Discord Global](https://discord.gg/nationsglory)** de NationsGlory et rejoindre le salon <#${
          dataONU["Salon NationsGlory"][serveur]
        }>.\n\nVoici les différentes **règlementations** :\n- Les assauts sont interdit\n- Le PvP est désactivé sauf dans les arènes et les warzones\n- Les warzones ne distribuent pas de récompenses\n- La présence des chefs est fortement recommandée\n\nCette réunion a lieu tous les **${jourStr.toLowerCase()}s** à **${heureStr}h${minuteStr}**.`,
      ),
    )
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems((mediaGalleryItem) =>
        mediaGalleryItem.setURL("attachment://onu.png"),
      ),
    )
    .addSeparatorComponents((s) => s)
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("onu_help")
          .setLabel("Je n'arrive pas à accéder au salon")
          .setStyle(ButtonStyle.Primary),
      ),
    );

  const imagePath = getAbsolutePath(`data/${serveur}/onu.png`);

  const attachment = new AttachmentBuilder(imagePath, {
    name: "onu.png",
  });

  const components = [container];

  return { components, files: [attachment] };
}

async function Rappel1(client, serveur, temps) {
  if (!temps) temps = "30";
  const dataONU = CONFIG_STATIC.find((c) => c.nom === "ONU").systeme.Alerte;
  const { jour, heure, minute, heureStr, minuteStr, jourStr } = parseHeureONU(
    dataONU.Heure[serveur],
  );

  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
    .addTextDisplayComponents((t) =>
      t.setContent(`## 📅 Rappel ONU ${config.serveur[serveur].nom}`),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `C'est bientôt l'ONU ! Pour rappel, cette réunion est prévue **ajourd'hui** à **${heureStr}h${minuteStr}**, donc dans exactement **${temps} ${
          Number(temps) > 1 ? "minutes" : "minute"
        }**. Ne manquez pas l'occasion de participer à ce regroupement !`,
      ),
    )
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems((mediaGalleryItem) =>
        mediaGalleryItem.setURL("attachment://rappel_onu.png"),
      ),
    );

  const imagePath = getAbsolutePath(`data/${serveur}/rappel_onu.png`);

  const attachment = new AttachmentBuilder(imagePath, {
    name: "rappel_onu.png",
  });

  const components = [container];

  return { components, files: [attachment] };
}

async function Rappel2(client, serveur, temps) {
  if (!temps) temps = "30";
  const dataONU = CONFIG_STATIC.find((c) => c.nom === "ONU").systeme.Alerte;
  const { jour, heure, minute, heureStr, minuteStr, jourStr } = parseHeureONU(
    dataONU.Heure[serveur],
  );

  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
    .addTextDisplayComponents((t) =>
      t.setContent(`## 📅 Rappel ONU ${config.serveur[serveur].nom}`),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `C'est bientôt l'ONU ! Pour rappel, cette réunion est prévue **ajourd'hui** à **${heureStr}h${minuteStr}**, donc dans exactement **${temps} ${
          Number(temps) > 1 ? "minutes" : "minute"
        }**. Ne manquez pas l'occasion de participer à ce regroupement !`,
      ),
    )
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems((mediaGalleryItem) =>
        mediaGalleryItem.setURL("attachment://rappel_onu.png"),
      ),
    );

  const imagePath = getAbsolutePath(`data/${serveur}/rappel_onu.png`);

  const attachment = new AttachmentBuilder(imagePath, {
    name: "rappel_onu.png",
  });

  const components = [container];

  return { components, files: [attachment] };
}

async function Rappel3(client, serveur, temps) {
  if (!temps) temps = "30";
  const dataONU = CONFIG_STATIC.find((c) => c.nom === "ONU").systeme.Alerte;
  const { jour, heure, minute, heureStr, minuteStr, jourStr } = parseHeureONU(
    dataONU.Heure[serveur],
  );

  const container = new ContainerBuilder()
    .setAccentColor(config.serveur[serveur].couleur)
    .addTextDisplayComponents((t) =>
      t.setContent(`## 📅 Rappel ONU ${config.serveur[serveur].nom}`),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `C'est bientôt l'ONU ! Pour rappel, cette réunion est prévue **ajourd'hui** à **${heureStr}h${minuteStr}**, donc dans exactement **${temps} ${
          Number(temps) > 1 ? "minutes" : "minute"
        }**. Ne manquez pas l'occasion de participer à ce regroupement !`,
      ),
    )
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems((mediaGalleryItem) =>
        mediaGalleryItem.setURL("attachment://rappel_onu.png"),
      ),
    );

  const imagePath = getAbsolutePath(`data/${serveur}/rappel_onu.png`);

  const attachment = new AttachmentBuilder(imagePath, {
    name: "rappel_onu.png",
  });

  const components = [container];

  return { components, files: [attachment] };
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
  SanctionStaff,
  Alerte,
  Rappel1,
  Rappel2,
  Rappel3,
};
