const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
  ContainerBuilder,
  ButtonStyle,
} = require("discord.js");
const { getEmojiTete } = require("../../../util/module/emoji");
const { getData } = require("../../../util/module/getAndSaveData");
const {
  discordLink,
  discordStaff,
} = require("../../../util/module/discordLink");
const proxyCommande = require("../../../util/proxy/proxyCommande");
const Configuration = require("../../../util/database/models/Configuration");
const Serveur = require("../../../util/database/models/Serveur");
const {
  buildErrorContainer,
  sendTemporaryError,
  replyOrUpdate,
} = require("../../../util/proxy/reply");

module.exports = {
  config: { permission: "guide" },
  data: new SlashCommandBuilder()
    .setName("staff")
    .setDescription("Affiche la liste des staffs")
    .addStringOption((option) =>
      option
        .setName("staff")
        .setDescription("Le membre du staff à configurer")
        .setRequired(false)
        .setAutocomplete(true),
    ),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },

  async proxy(client, interaction, config) {
    const { serveur, staff: staffParam } = interaction.parametre;
    const srvConfig = config.serveur[serveur];

    const { pseudonym, servers } = await discordStaff(
      interaction.user.id,
      serveur,
      "super_moderateur",
    );

    const staff = servers.length === 0 ? pseudonym : staffParam;

    if (!staff) {
      return showStaffList(interaction, config, serveur, srvConfig);
    }

    return showStaffManagement(
      client,
      interaction,
      config,
      serveur,
      srvConfig,
      staff,
    );
  },
};

async function showStaffList(interaction, config, serveur, srvConfig) {
  const [linkResult, staffServeur, configRoutine, configJail] =
    await Promise.all([
      discordLink(false),
      Serveur.findOne({ serveur }).lean(),
      Configuration.findOne({
        serveur,
        guildId: interaction.guild.id,
        categorie: "Routine",
        systeme: "Routine",
      }),
      Configuration.findOne({
        serveur,
        guildId: interaction.guild.id,
        categorie: "Jail",
        systeme: "Jail",
      }),
    ]);

  const linkData = linkResult?.data ?? {};
  const idByName = new Map(
    Object.entries(linkData).map(([id, name]) => [name, id]),
  );

  const container = new ContainerBuilder()
    .setAccentColor(srvConfig.couleur)
    .addTextDisplayComponents((t) =>
      t.setContent("## <:liste:1441495206229835979> Liste des Staffs"),
    )
    .addSeparatorComponents((s) => s);

  for (const [grade, members] of Object.entries(staffServeur.staff)) {
    const memberNames = members
      .map((name) => {
        const linkedId = idByName.get(name);
        const escapedName = name.replace(/_/g, "\\_");
        return linkedId ? `${escapedName} ( <@${linkedId}> )` : escapedName;
      })
      .join(", ");

    container
      .addTextDisplayComponents((t) =>
        t.setContent(
          `**<:${grade}:${config.grade[grade].emoji}> ${members.length > 1 ? config.grade[grade].nom.pluriel : config.grade[grade].nom.normal} (${members.length}):**`,
        ),
      )
      .addTextDisplayComponents((t) =>
        t.setContent(memberNames || "Aucun staff ne possède ce grade"),
      )
      .addSeparatorComponents((s) => s);
  }

  const options = [
    {
      label: "Liste des Staffs",
      value: "globalstaff_liste",
      default: true,
      emoji: "1441495206229835979",
    },
    {
      label: "Activité en Jeu",
      value: "globalstaff_activitejeu",
      default: false,
      emoji: "1441495207932596234",
    },
    {
      label: "Activité Vocal sur Discord",
      value: "globalstaff_activitediscord",
      default: false,
      emoji: "1441495208951808203",
    },
    {
      label: "Traitement des Attentes Staffs",
      value: "globalstaff_traitement",
      default: false,
      emoji: "1441495210206036141",
    },
  ];

  if (configJail) {
    options.push({
      label: "Jail",
      value: "globalstaff_jail",
      default: false,
      emoji: "1441734907260043264",
    });
  }

  if (configRoutine) {
    options.push({
      label: "Routine",
      value: "globalstaff_routine",
      default: false,
      emoji: "1441734905980649695",
    });
  }

  container.addActionRowComponents((row) =>
    row.setComponents(
      new StringSelectMenuBuilder()
        .setCustomId("globalstaff")
        .setPlaceholder("Choisit une option")
        .setOptions(options),
    ),
  );

  return replyOrUpdate(interaction, [container], {
    allowedMentions: { parse: [] },
  });
}

async function showStaffManagement(
  client,
  interaction,
  config,
  serveur,
  srvConfig,
  staff,
) {
  const staffData = getData(`data/${serveur}/staff/${staff}.json`);

  if (!staffData) {
    return sendTemporaryError(
      interaction,
      buildErrorContainer(
        config,
        "❌ Erreur",
        `Le joueur "**${staff}**" n'existe pas ou ne fait pas partie du staff du serveur ${srvConfig.emoji_formate} **${srvConfig.nom}**.`,
      ),
    );
  }

  if (interaction.isMessageComponent()) {
    await interaction.deferUpdate();
  } else {
    await interaction.deferReply();
  }

  const blameLevels = ["Blâme 1", "Blâme 2", "Blâme 3"];
  const blame = blameLevels.filter(
    (level) =>
      staffData[level] !== undefined &&
      staffData[level] !== null &&
      staffData[level] !== false,
  ).length;

  const formatServeur = srvConfig.nom;

  const [
    staffServeur,
    linkedDiscordIdData,
    body,
    linkedMinecraftPseudonym,
    emojiTete,
    configRoutine,
    configJail,
  ] = await Promise.all([
    Serveur.findOne({ serveur }).lean(),
    discordLink(false).then((r) => r?.data ?? {}),
    fetchPublicProfile(staff, config),
    fetchBedrockPseudonym(serveur, staff, config),
    getEmojiTete(client, staff).then((emoji) => emoji || "🧑"),
    Configuration.findOne({
      serveur,
      guildId: interaction.guild.id,
      categorie: "Routine",
      systeme: "Routine",
    }),
    Configuration.findOne({
      serveur,
      guildId: interaction.guild.id,
      categorie: "Jail",
      systeme: "Jail",
    }),
  ]);

  const gradeDuJoueur =
    Object.entries(staffServeur.staff).find(
      ([, members]) => Array.isArray(members) && members.includes(staff),
    )?.[0] || "Inconnu";

  const linkedDiscordId = Object.entries(linkedDiscordIdData).find(
    ([, name]) =>
      typeof name === "string" && name.toLowerCase() === staff.toLowerCase(),
  )?.[0];

  const roleAutoriseRoutine = configRoutine?.data.get("Grade");
  const roleAutoriseJail = configJail?.data.get("Grade");

  const gradesHierarchie = Object.entries(config.grade)
    .sort(([, a], [, b]) => b.priorite - a.priorite)
    .map(([grade]) => grade);

  const utilisateurAutoriseRoutine =
    configRoutine?.active &&
    roleAutoriseRoutine &&
    gradesHierarchie
      .slice(0, gradesHierarchie.indexOf(roleAutoriseRoutine) + 1)
      .includes(gradeDuJoueur);

  const utilisateurAutoriseJail =
    configJail?.active &&
    roleAutoriseJail &&
    gradesHierarchie
      .slice(0, gradesHierarchie.indexOf(roleAutoriseJail) + 1)
      .includes(gradeDuJoueur);

  const optionsMenu = [
    {
      label: "Information Générale",
      value: "gestionstaff_information",
      default: true,
      emoji: "1441495206229835979",
    },
    {
      label: "Activité en Jeu",
      value: "gestionstaff_activitejeu",
      default: false,
      emoji: "1441495207932596234",
    },
    {
      label: "Activité Vocal sur Discord",
      value: "gestionstaff_activitediscord",
      default: false,
      emoji: "1441495208951808203",
    },
    {
      label: "Traitement des Attentes Staffs",
      value: "gestionstaff_traitement",
      default: false,
      emoji: "1441495210206036141",
    },
  ];

  if (utilisateurAutoriseJail) {
    optionsMenu.push({
      label: "Jail",
      value: "gestionstaff_jail",
      default: false,
      emoji: "1441734907260043264",
    });
  }

  if (utilisateurAutoriseRoutine) {
    optionsMenu.push({
      label: "Routine",
      value: "gestionstaff_routine",
      default: false,
      emoji: "1441734905980649695",
    });
  }

  if (serveur === "cyan") {
    optionsMenu.push({
      label: "Quizz",
      value: "gestionstaff_quizz",
      default: false,
      emoji: "❓",
    });
  }

  const container = new ContainerBuilder()
    .setAccentColor(srvConfig.couleur)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `## ${emojiTete} Gestion Staff - ${staff.replace(/_/g, "\\_")}`,
      ),
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((t) =>
      t.setContent(
        `**Grade :** <:${gradeDuJoueur}:${config.grade[gradeDuJoueur].emoji}> ${config.grade[gradeDuJoueur].nom.normal}`,
      ),
    );

  const lastConn = body?.servers?.[serveur]?.last_connection;
  const playtime = body?.servers?.[serveur]?.playtime;

  if (lastConn) {
    const lastConnFormatted = `<t:${Math.floor(
      new Date(new Date(lastConn + " GMT+0200").toISOString()).getTime() / 1000,
    )}:R>`;
    const playtimeFormatted = playtime ? convertirTemps(playtime) : null;

    container.addTextDisplayComponents((t) =>
      t.setContent(
        `\n**Dernière Connexion ${formatServeur} :** ${lastConnFormatted}\n` +
          `**Temps de Jeu ${formatServeur} :** ${playtimeFormatted}\n` +
          `**Temps de Jeu Total :** ${totalTemps(body)}`,
      ),
    );
  }

  container.addSeparatorComponents((s) => s);

  container.addSectionComponents((section) =>
    section
      .addTextDisplayComponents((t) =>
        t.setContent(
          `**Liaison Discord :** ${linkedDiscordId ? `<@${linkedDiscordId}>` : "Aucune liaison"}`,
        ),
      )
      .setButtonAccessory((button) =>
        button
          .setCustomId(`gestionstaff_liaisondiscord-${staff}`)
          .setLabel(
            linkedDiscordId ? "Modifier la Liaison" : "Ajouter une Liaison",
          )
          .setStyle(ButtonStyle.Primary),
      ),
  );

  if (config.liste_serveur_bedrock.includes(serveur)) {
    container.addSectionComponents((section) =>
      section
        .addTextDisplayComponents((t) =>
          t.setContent(
            `**Liaison Minecraft :** ${linkedMinecraftPseudonym ?? "Aucune liaison"}`,
          ),
        )
        .setButtonAccessory((button) =>
          button
            .setCustomId(`gestionstaff_liaisonminecraft-${staff}`)
            .setLabel(
              linkedMinecraftPseudonym
                ? "Modifier la Liaison"
                : "Ajouter une Liaison",
            )
            .setStyle(ButtonStyle.Primary),
        ),
    );
  }

  container
    .addSectionComponents((section) =>
      section
        .addTextDisplayComponents((t) =>
          t.setContent(`**Blâme${blame > 0 ? "s" : ""} :** ${blame}`),
        )
        .setButtonAccessory((button) =>
          button
            .setCustomId(`gestionstaff_blame-${staff}`)
            .setLabel("Afficher ou Modifier les Blâmes")
            .setStyle(ButtonStyle.Primary),
        ),
    )
    .addSeparatorComponents((s) => s)
    .addActionRowComponents((row) =>
      row.setComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`gestionstaff-${staff}`)
          .setPlaceholder("Choisit une option")
          .setOptions(optionsMenu),
      ),
    );

  return interaction.editReply({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  });
}

async function fetchPublicProfile(staff, config) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(
      `https://publicapi.nationsglory.fr/user/${encodeURIComponent(staff)}`,
      {
        headers: {
          Authorization: `Bearer ${config.apitoken_backup}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      },
    );
    return await res.json();
  } catch (error) {
    if (error.name !== "AbortError")
      console.error("Erreur API NG :", error.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchBedrockPseudonym(serveur, staff, config) {
  if (!config.liste_serveur_bedrock.includes(serveur)) return null;

  const res = await fetch(
    `${config.glorybot_url}/api/get-bedrock?pseudo_ng=${encodeURIComponent(staff)}`,
  );
  if (!res.ok) return null;

  const data = await res.json();
  return data.pseudo_mc || null;
}

function convertirTemps(secondes) {
  const jours = Math.floor(secondes / (3600 * 24));
  const heures = Math.floor((secondes % (3600 * 24)) / 3600);
  const minutes = Math.floor((secondes % 3600) / 60);

  let temps = "";

  if (jours > 0) {
    temps += jours + " jour" + (jours > 1 ? "s" : "") + ", ";
  }

  if (heures > 0) {
    temps += heures + " heure" + (heures > 1 ? "s" : "") + " et ";
  }

  temps += minutes + " minute" + (minutes > 1 ? "s" : "");

  return temps;
}

function totalTemps(body) {
  let total = 0;
  for (const server in body.servers) {
    if (body.servers[server].playtime) {
      total += body.servers[server].playtime;
    }
  }

  return convertirTemps(total);
}
