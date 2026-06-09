const config = require("../../config");
const log = require("../../util/module/log");
const { getData, saveData } = require("../../util/module/getAndSaveData");
const { getEmojiDrapeau, getEmojiTete } = require("../../util/module/emoji");
const { DateTime } = require("luxon");
const cheerio = require("cheerio");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require("discord.js");
const Configuration = require("../../util/database/models/Configuration");

async function fetchAndParseCountriesHTML(serveur) {
  try {
    const response = await fetch(
      `https://nationsglory.fr/_servers/server_loader?server=${serveur}&uri=countries`,
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    );
    const html = await response.text();
    const $ = cheerio.load(html);

    const countries = [];
    $("#tablepays tbody tr").each((i, row) => {
      const $row = $(row);
      const name = $row.find("td a span").text().trim();
      const leader = $row.find("td").eq(1).text().trim();
      const date_fondation = $row.find("td").eq(3).text().trim();

      countries.push({ nom: name, chef: leader, date: date_fondation });
    });
    return countries;
  } catch (err) {
    console.error(`❌ Erreur lors du parsing HTML pour ${serveur} :`, err);
    return [];
  }
}

async function disband_14h00(client) {
  for (const serveur of config.liste_serveur) {
    const configurations = await Configuration.find({
      serveur,
      categorie: "Disband",
      systeme: "Pays Pillable ( 14h )",
    });

    const container = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((t) =>
        t.setContent("## 💥 C'est l'heure des disbands !"),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          "L'intégralité des pays soumis aux disbands est désormais disponible au pillage. C'est-à-dire que vous pouvez vous rendre dans ces pays et récupérer l'intégralité des ressources disponibles dans les coffres et ainsi casser des blocs. Il faut savoir que les pays sont pillables à partir de 14h, ils sont régénérés et supprimés à 18h.\n\nVoici les 4 différentes raisons de disband :\n- Inactivité du chef et du/des officier(s) de plus de 14 jours\n- Pays ayant moins de 6 membres\n- Pays sans fhome durant une semaine consécutive\n- Inactivité au serveur du pays durant plus d'un mois, après la mise en garde du staff\n\nSi tu ne peux pas te connecter pendant un long moment et tu as peur de te faire disband, alors effectue la commande ```/f absence add <vacation/other> <JJ/MM/YYYY de début> <JJ/MM/YYYY de fin>```",
        ),
      )
      .addSeparatorComponents((s) => s)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Wiki Disband")
            .setURL(
              "https://wiki.nationsglory.fr/fr/article/les-disbands-java-fqxmmr/",
            )
            .setStyle(ButtonStyle.Link)
            .setEmoji("1319374787570831421"),
          new ButtonBuilder()
            .setLabel("Wiki Absence")
            .setURL(
              "https://wiki.nationsglory.fr/fr/article/gerer-son-pays-java-1lm9j56/#1-les-absences",
            )
            .setStyle(ButtonStyle.Link)
            .setEmoji("1319374787570831421"),
        ),
      );

    let disbandData;
    try {
      const response = await fetch(
        `${config.glorybot_url}/api/disband?serveur=${serveur}`,
        {
          headers: {
            Authorization: `Bearer ${config.glorybot_token}`,
            "Content-Type": "application/json",
          },
        },
      );
      disbandData = await response.json();
    } catch (err) {
      console.error("Erreur lors de la récupération des pays disband :", err);
      return;
    }

    const uniqueCountries = new Set();
    const memberCountries = [];
    const inactiveCountries = [];
    const fhomeCountries = [];

    for (const country of disbandData) {
      if (!country.nom) continue;

      if (country.raison === "membre" && !uniqueCountries.has(country.nom)) {
        memberCountries.push(country);
        uniqueCountries.add(country.name);
      } else if (
        country.raison === "inactivite" &&
        !uniqueCountries.has(country.nom)
      ) {
        inactiveCountries.push(country);
        uniqueCountries.add(country.nom);
      } else if (
        country.raison === "fhome" &&
        !uniqueCountries.has(country.nom)
      ) {
        fhomeCountries.push(country);
        uniqueCountries.add(country.nom);
      }
    }

    async function formatCountriesWithFlags(list) {
      const result = [];
      for (const country of list) {
        const emoji =
          (await getEmojiDrapeau(client, serveur, country.nom.toLowerCase())) ||
          "🏳️";
        if (emoji) result.push(`${emoji} ${country.nom}`);
        else result.push(`${country.nom}`);
      }
      return result.join("\n");
    }

    let description = "";

    if (memberCountries.length > 0) {
      const formatted = await formatCountriesWithFlags(memberCountries);
      description += `**Moins de 6 membres :**\n${formatted}`;
    }
    if (inactiveCountries.length > 0) {
      const formatted = await formatCountriesWithFlags(inactiveCountries);
      description += `\n\n**Inactivité :**\n${formatted}`;
    }
    if (fhomeCountries.length > 0) {
      const formatted = await formatCountriesWithFlags(fhomeCountries);
      description += `\n\n**F Home :**\n${formatted}`;
    }

    description +=
      "\n\nCes pays sont désormais disponible au pillage. C'est-à-dire que vous pouvez vous rendre dans ces pays et récupérer l'intégralité des ressources disponibles dans les coffres et ainsi casser des blocs. Il faut savoir que les pays sont pillables à partir de 14h, ils sont régénérés et supprimés à 18h.\n\nVoici les 4 différentes raisons de disband :\n- Inactivité du chef et du/des officier(s) de plus de 14 jours\n- Pays ayant moins de 6 membres\n- Pays sans fhome durant une semaine consécutive\n- Inactivité au serveur du pays durant plus d'un mois, après la mise en garde du staff\n\nSi tu ne peux pas te connecter pendant un long moment et tu as peur de te faire disband, alors effectue la commande ```/f absence add <vacation/other> <JJ/MM/YYYY de début> <JJ/MM/YYYY de fin>```\n*À savoir que cette liste est une approximation, elle ne prend pas en compte les absences et peut avoir des erreurs.*";

    if (
      inactiveCountries.length === 0 &&
      memberCountries.length === 0 &&
      fhomeCountries.length === 0
    ) {
      description =
        "L'intégralité des pays soumis aux disbands est désormais disponible au pillage. C'est-à-dire que vous pouvez vous rendre dans ces pays et récupérer l'intégralité des ressources disponibles dans les coffres et ainsi casser des blocs. Il faut savoir que les pays sont pillables à partir de 14h, ils sont régénérés et supprimés à 18h.\n\nVoici les 4 différentes raisons de disband :\n- Inactivité du chef et du/des officier(s) de plus de 14 jours\n- Pays ayant moins de 6 membres\n- Pays sans fhome durant une semaine consécutive\n- Inactivité au serveur du pays durant plus d'un mois, après la mise en garde du staff\n\nSi tu ne peux pas te connecter pendant un long moment et tu as peur de te faire disband, alors effectue la commande ```/f absence add <vacation/other> <JJ/MM/YYYY de début> <JJ/MM/YYYY de fin>```";
    }

    const containerPrevisualisation = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((t) =>
        t.setContent("## 💥 C'est l'heure des disbands !"),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) => t.setContent(description))
      .addSeparatorComponents((s) => s)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Wiki Disband")
            .setURL(
              "https://wiki.nationsglory.fr/fr/article/les-disbands-java-fqxmmr/",
            )
            .setStyle(ButtonStyle.Link)
            .setEmoji("1319374787570831421"),
          new ButtonBuilder()
            .setLabel("Wiki Absence")
            .setURL(
              "https://wiki.nationsglory.fr/fr/article/gerer-son-pays-java-1lm9j56/#1-les-absences",
            )
            .setStyle(ButtonStyle.Link)
            .setEmoji("1319374787570831421"),
        ),
      );

    for (const configDisband of configurations) {
      if (!configDisband.active) continue;

      const guildId = configDisband.guildId;

      const guild = client.guilds.cache.get(guildId);
      if (!guild) continue;

      const previsualisation =
        configDisband.data.get("Prévisualisation") || "Oui";

      const channelId = configDisband.data.get("Salon");
      if (!channelId) continue;

      const channel = guild.channels.cache.get(channelId);
      if (!channel) continue;

      const roleIds = configDisband.data.get("Role") || [];
      const roleMentions = roleIds.map((id) => `<@&${id}>`).join(" ");

      let components = [
        previsualisation === "Oui" ? containerPrevisualisation : container,
      ];
      if (roleMentions.length > 0)
        components = [
          new TextDisplayBuilder().setContent(roleMentions),
          previsualisation === "Oui" ? containerPrevisualisation : container,
        ];

      try {
        const sentMessage = await channel.send({
          components,
          flags: MessageFlags.IsComponentsV2,
        });

        if (channel.type === ChannelType.GuildNews)
          await sentMessage.crosspost();

        log(
          `✅ Message disband pillage | serveur ${serveur} | guild ${guildId}`,
          "LOG",
          "gray",
        );
      } catch (err) {
        console.error(
          `❌ Erreur envoi disband pillage | serveur ${serveur} | guild ${guildId}`,
          err,
        );
      }
    }
  }
}

async function disband_17h59() {
  const countrySnapshot = {};
  for (const serveur of config.liste_serveur) {
    try {
      const responseJson = await fetch(
        `https://apiv2.nationsglory.fr/mods/country_list/${serveur}`,
      );
      const jsonCountries = await responseJson.json();

      const htmlCountries = await fetchAndParseCountriesHTML(serveur);

      countrySnapshot[serveur] = { jsonCountries, htmlCountries };
    } catch (err) {
      console.error(
        `❌ Impossible de récupérer les pays pour ${serveur} :`,
        err,
      );
    }
  }

  saveData("data/country_list.json", countrySnapshot);
  log("✅ Sauvegarde des pays (JSON + HTML) à 17h58 terminée.", "LOG", "gray");
}

async function disband_18h15(client) {
  let savedCountries = getData("data/country_list.json");
  if (!savedCountries) savedCountries = {};

  for (const serveur of config.liste_serveur) {
    const configurations = await Configuration.find({
      serveur,
      categorie: "Disband",
      systeme: "Pays Disband ( 18h15 )",
    });

    const responseJson = await fetch(
      `https://apiv2.nationsglory.fr/mods/country_list/${serveur}`,
    );
    const newJsonCountries = await responseJson.json();

    const newHtmlCountries = await fetchAndParseCountriesHTML(serveur);
    saveData(`data/new_country_list_${serveur}.json`, newHtmlCountries);

    const oldJsonCountries = savedCountries[serveur]?.jsonCountries || [];
    const oldJsonNames = new Set(oldJsonCountries.map((c) => c.name));

    const addedJsonCountries = newJsonCountries.filter(
      (c) => !oldJsonNames.has(c.name),
    );

    const oldHtmlCountries = savedCountries[serveur]?.htmlCountries || [];

    const oldNameDatePairs = new Set(
      oldHtmlCountries.map((c) => `${c.nom}|${c.date}`),
    );

    const addedHtmlCountries = newHtmlCountries.filter(
      (c) => !oldNameDatePairs.has(`${c.nom}|${c.date}`),
    );

    const today = DateTime.local().setLocale("fr").startOf("day");
    const todayHtmlCountries = addedHtmlCountries.filter((c) => {
      const parsedDate = DateTime.fromFormat(c.date, "dd LLLL yyyy", {
        locale: "fr",
      }).startOf("day");
      return parsedDate.equals(today);
    });

    let description =
      "L'intégralité des pays qui étaient disponibles au pillage à 14h ont été supprimés.";

    const formattedJsonCountries = [];

    for (const c of addedJsonCountries.sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      try {
        const flag =
          (await getEmojiDrapeau(client, serveur, c.name.toLowerCase())) ||
          "🏳️";

        formattedJsonCountries.push(`${flag} ${c.name}`);
      } catch (err) {
        console.error(
          `Erreur lors de la récupération de l'emoji pour ${c.name}:`,
          err,
        );
        formattedJsonCountries.push(`${c.name}`);
      }
    }

    if (formattedJsonCountries.length > 0) {
      description += `\n\n${formattedJsonCountries.join("\n")}`;
    }

    const formattedHtmlCountries = [];

    for (const c of todayHtmlCountries.sort((a, b) =>
      a.nom.localeCompare(b.nom),
    )) {
      try {
        const flag =
          (await getEmojiDrapeau(client, serveur, c.nom.toLowerCase())) || "🏳️";

        let headEmoji = null;
        if (c.chef) {
          headEmoji = (await getEmojiTete(client, c.chef)) || "🧑";
        }

        const leaderInfo = c.chef ? `\n↪ Créé par ${headEmoji}${c.chef}` : "";

        formattedHtmlCountries.push(`${flag} ${c.nom}${leaderInfo}`);
      } catch (err) {
        console.error(`Erreur pour le pays ${c.nom}:`, err);
        formattedHtmlCountries.push(c.nom);
      }
    }

    if (formattedHtmlCountries.length > 0) {
      description += `\n${formattedHtmlCountries.join("\n")}`;
    }

    const container = new ContainerBuilder()
      .setAccentColor(config.serveur[serveur].couleur)
      .addTextDisplayComponents((t) =>
        t.setContent("## 💥 Les pays sont supprimés !"),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) => t.setContent(description))
      .addSeparatorComponents((s) => s)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Wiki Disband")
            .setURL(
              "https://wiki.nationsglory.fr/fr/article/les-disbands-java-fqxmmr/",
            )
            .setStyle(ButtonStyle.Link)
            .setEmoji("1319374787570831421"),
          new ButtonBuilder()
            .setLabel("Wiki Absence")
            .setURL(
              "https://wiki.nationsglory.fr/fr/article/gerer-son-pays-java-1lm9j56/#1-les-absences",
            )
            .setStyle(ButtonStyle.Link)
            .setEmoji("1319374787570831421"),
        ),
      );

    for (const configDisband of configurations) {
      if (!configDisband.active) continue;

      const guildId = configDisband.guildId;

      const guild = client.guilds.cache.get(guildId);
      if (!guild) continue;

      const channelId = configDisband.data.get("Salon");
      if (!channelId) continue;

      const channel = guild.channels.cache.get(channelId);
      if (!channel) continue;

      const roleIds = configDisband.data.get("Role") || [];
      const roleMentions = roleIds.map((id) => `<@&${id}>`).join(" ");

      let components = [container];
      if (roleMentions.length > 0)
        components = [
          new TextDisplayBuilder().setContent(roleMentions),
          container,
        ];

      try {
        const sentMessage = await channel.send({
          components,
          flags: MessageFlags.IsComponentsV2,
        });

        if (channel.type === ChannelType.GuildNews)
          await sentMessage.crosspost();

        log(
          `✅ Message disband 18h15 | serveur ${serveur} | guild ${guildId}`,
          "LOG",
          "gray",
        );
      } catch (err) {
        console.error(
          `❌ Erreur envoi disband 18h15 | serveur ${serveur} | guild ${guildId}`,
          err,
        );
      }
    }
  }
}

module.exports = { disband_14h00, disband_17h59, disband_18h15 };
