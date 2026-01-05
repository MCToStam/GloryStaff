const fs = require("node:fs");
const path = require("node:path");
const Canvas = require("canvas");
const config = require("../../config");
const { log } = require("node:console");

const cachePath = path.join(__dirname, "..", "..", "data", "emojisCache.json");
let emojisCache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
const pendingEmojis = {};

async function saveCache() {
  await fs.promises
    .writeFile(cachePath, JSON.stringify(emojisCache, null, 2))
    .catch(console.error);
}

async function scheduleDeleteEmoji(
  client,
  key,
  emojiId,
  delay = 60 * 60 * 1000,
) {
  setTimeout(async () => {
    try {
      if (!client.application) await client.application.fetch();
      const emoji = await client.application.emojis.fetch(emojiId);
      if (emoji) await emoji.delete();
    } catch (e) {
      console.warn(`⚠️ Erreur suppression emoji ${key}:`, e.message);
    } finally {
      delete emojisCache[key];
      await saveCache();
    }
  }, delay);
}

async function createOrFetchEmoji(client, key, buffer, extraData = {}) {
  const now = Date.now();
  try {
    const emoji = await client.application.emojis.create({
      name: key.slice(0, 32),
      attachment: buffer,
    });
    emojisCache[key] = { emojiId: emoji.id, ...extraData, createdAt: now };
    await saveCache();
    scheduleDeleteEmoji(client, key, emoji.id);
    return emoji;
  } catch (e) {
    if (e.message.includes("Invalid Form Body")) {
      const emojis = await client.application.emojis.fetch();
      const existing = emojis.find((e) => e.name === key.slice(0, 32));
      if (existing) {
        emojisCache[key] = {
          emojiId: existing.id,
          ...extraData,
          createdAt: now,
        };
        await saveCache();
        scheduleDeleteEmoji(client, key, existing.id);
        return existing;
      }
    }
    throw e;
  }
}

async function getEmojiDrapeau(client, serveur, pays) {
  const key = `${serveur.toLowerCase()}_${pays.toLowerCase()}`;
  const now = Date.now();

  if (!client.application) await client.application.fetch();

  if (pendingEmojis[key]) return pendingEmojis[key];

  if (emojisCache[key]) {
    try {
      const emoji = await client.application.emojis.fetch(
        emojisCache[key].emojiId,
      );
      if (emoji) return emoji;
    } catch {
      delete emojisCache[key];
      await saveCache();
    }
  }

  pendingEmojis[key] = (async () => {
    const url = `${config.glorybot_url}/api/drapeau?serveur=${serveur}&pays=${pays}`;
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(
        `Impossible de récupérer l'image pour ${pays} et ${serveur}`,
      );
    const buffer = Buffer.from(await response.arrayBuffer());

    return await createOrFetchEmoji(client, key, buffer, { nom: key });
  })();

  try {
    const emoji = await pendingEmojis[key];
    return emoji;
  } finally {
    delete pendingEmojis[key];
  }
}

async function getEmojiTete(client, joueur) {
  const key = joueur.toLowerCase();
  const now = Date.now();

  if (!client.application) await client.application.fetch();

  if (pendingEmojis[key]) return pendingEmojis[key];

  if (emojisCache[key]) {
    try {
      const emoji = await client.application.emojis.fetch(
        emojisCache[key].emojiId,
      );
      if (emoji) return emoji;
    } catch {
      delete emojisCache[key];
      await saveCache();
    }
  }

  pendingEmojis[key] = (async () => {
    const url = `https://skins.nationsglory.fr/face/${joueur}/3d/4`;
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Impossible de récupérer l'image pour ${joueur}`);
    const buffer = Buffer.from(await response.arrayBuffer());

    return await createOrFetchEmoji(client, key, buffer, { nom: key });
  })();

  try {
    const emoji = await pendingEmojis[key];
    return emoji;
  } finally {
    delete pendingEmojis[key];
  }
}

async function getHexEmoji(client, hexColor) {
  const key = hexColor.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const now = Date.now();

  if (!client.application) await client.application.fetch();

  if (pendingEmojis[key]) return pendingEmojis[key];

  if (emojisCache[key]) {
    try {
      const emoji = await client.application.emojis.fetch(
        emojisCache[key].emojiId,
      );
      if (emoji) return emoji;
    } catch {
      delete emojisCache[key];
      await saveCache();
    }
  }

  pendingEmojis[key] = (async () => {
    const canvas = Canvas.createCanvas(32, 32);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = hexColor;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();

    const buffer = canvas.toBuffer("image/png");

    return await createOrFetchEmoji(client, key, buffer, { nom: key });
  })();

  try {
    const emoji = await pendingEmojis[key];
    return emoji;
  } finally {
    delete pendingEmojis[key];
  }
}

async function checkEmojiCache(client) {
  if (!client.application) await client.application.fetch();
  const now = Date.now();

  for (const [key, { emojiId, createdAt }] of Object.entries(emojisCache)) {
    const age = now - createdAt;
    const oneHour = 60 * 60 * 1000;

    if (age >= oneHour) {
      try {
        const emoji = await client.application.emojis.fetch(emojiId);
        if (emoji) await emoji.delete();
      } catch {}
      delete emojisCache[key];
      await saveCache();
    } else {
      scheduleDeleteEmoji(client, key, emojiId, oneHour - age);
    }
  }
}

module.exports = {
  getEmojiDrapeau,
  getEmojiTete,
  getHexEmoji,
  checkEmojiCache,
};
