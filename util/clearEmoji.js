const log = require("../util/module/log");

async function clearEmoji(client) {
  if (!client.application) await client.application.fetch();

  const emojis = await client.application.emojis.fetch();

  let deleted = 0;

  for (const emoji of emojis.values()) {
    if (emoji.author.id === "1315668601851871325") {
      await emoji.delete();
      deleted++;
    }
  }

  log(`✅ ${deleted} application emoji(s) supprimé(s)`, "LOG", "gray");
}

module.exports = clearEmoji;
