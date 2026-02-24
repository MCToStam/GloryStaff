if (Number(process.version.slice(1).split(".")[0]) < 19)
  throw new Error("Node 19.x is required. Update Node on your system.");
require("dotenv").config({ quiet: true });

const {
  Client,
  Collection,
  Partials,
  GatewayIntentBits,
  IntentsBitField,
} = require("discord.js");
const { readdirSync, statSync } = require("fs");
const pathModule = require("path");
const log = require("./util/module/log.js");
const botLaunch = [];
const client = new Client({
  intents: new IntentsBitField([
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ]),
  partials: [Partials.User, Partials.Channel, Partials.GuildMember],
});

const slashCmds = new Collection();
client.cooldowns = new Collection();
const userCmds = new Collection();
const msgCmds = new Collection();
const buttons = new Collection();
const stringSelects = new Collection();
const channelSelects = new Collection();
const roleSelects = new Collection();
const modals = new Collection();

client.container = {
  slashCmds,
  userCmds,
  msgCmds,
  buttons,
  stringSelects,
  channelSelects,
  roleSelects,
  modals,
};

const init = async () => {
  async function load(type, dirPath, typeLog) {
    function getFilesRecursively(dir) {
      let results = [];
      const list = readdirSync(dir);

      for (const file of list) {
        const fullPath = pathModule.join(dir, file);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          results = results.concat(getFilesRecursively(fullPath));
        } else if (file.endsWith(".js")) {
          results.push(fullPath);
        }
      }

      return results;
    }

    const files = getFilesRecursively(dirPath);

    for (const file of files) {
      const fullPath = pathModule.resolve(file);
      const command = require(fullPath);
      const commandName = pathModule.basename(file, ".js");

      if (!command.data || !command.data.name) {
        log(
          `⚠️ La commande "${commandName}" n'a pas de "data" ou "data.name". Ignorée.`,
          "error",
          "red",
        );
        continue;
      }

      log(`✅ Chargement ${typeLog}: ${commandName}`, "LOG", "gray");
      client.container[type].set(command.data.name, command);
    }
  }

  botLaunch.push(new Date());
  await load("slashCmds", "./src/commands/slash", "Slash command");
  await load("userCmds", "./src/commands/user", "User command");
  await load("msgCmds", "./src/commands/message", "Message command");
  await load("buttons", "./src/events/button", "Button");
  await load("stringSelects", "./src/events/select/string", "String select");
  await load("channelSelects", "./src/events/select/channel", "Channel select");
  await load("roleSelects", "./src/events/select/role", "Role select");
  await load("modals", "./src/events/modal", "Modals");

  const eventFiles = readdirSync("./src/events/interaction").filter((file) =>
    file.endsWith(".js"),
  );

  for (const file of eventFiles) {
    const eventName = file.split(".")[0];
    log(`✅ Chargement de l'Événement ${eventName}`, "LOG", "gray");
    const event = require(`./src/events/interaction/${file}`);
    client.on(eventName, event.bind(null, client));
  }

  client.login();
  log(`Node ${process.version} !`, "READY", "green");
};

init();

module.exports = { botLaunch, client };
