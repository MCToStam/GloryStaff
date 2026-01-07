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

  console.log(`✅ ${deleted} application emoji(s) supprimé(s)`);
}

module.exports = clearEmoji;
