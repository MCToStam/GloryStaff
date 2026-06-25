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
let botLaunch;
const clientStore = require("./util/client");
const log = require("./util/module/log");
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
    const getFilesRecursively = (dir) =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory()
          ? getFilesRecursively(pathModule.join(dir, entry.name))
          : entry.name.endsWith(".js")
            ? [pathModule.join(dir, entry.name)]
            : [],
      );

    const files = getFilesRecursively(dirPath);

    for (const file of files) {
      const fullPath = pathModule.resolve(file);
      delete require.cache[require.resolve(fullPath)];
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

      client.container[type].set(command.data.name, command);
    }
  }

  botLaunch = Date.now();
  const loaders = [
    ["slashCmds", "./src/commands/slash", "Slash command"],
    ["userCmds", "./src/commands/user", "User command"],
    ["msgCmds", "./src/commands/message", "Message command"],
    ["buttons", "./src/events/button", "Button"],
    ["stringSelects", "./src/events/select/string", "String select"],
    ["channelSelects", "./src/events/select/channel", "Channel select"],
    ["roleSelects", "./src/events/select/role", "Role select"],
    ["modals", "./src/events/modal", "Modals"],
  ];

  await Promise.all(
    loaders.map(async ([t, p, l]) => {
      await load(t, p, l);
    }),
  );

  const eventFiles = readdirSync("./src/events/interaction").filter((file) =>
    file.endsWith(".js"),
  );

  for (const file of eventFiles) {
    const eventName = file.split(".")[0];
    log(`✅ Chargement de l'Événement ${eventName}`, "LOG", "gray");
    const event = require(`./src/events/interaction/${file}`);
    client.on(eventName, (...args) => event(client, ...args));
  }

  client.login(process.env.TOKEN);
  clientStore.setClient(client);
  log(`Node ${process.version} !`, "READY", "green");
};

init();

module.exports = { botLaunch, client };
