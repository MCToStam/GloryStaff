const Canvas = require("canvas");
const crypto = require("crypto");
const Pays = require("../../util/database/models/Pays");
const config = require("../../config");
const { getData, saveData } = require("./getAndSaveData");

const cachePath = "data/emojisCache.json";
let emojisCache = getData(cachePath) || {};
const pendingEmojis = new Map();
const ONE_HOUR = 60 * 60 * 1000;

function saveCache() {
  saveData(cachePath, emojisCache);
}

function getDrapeauEmojiKey(serveur, pays) {
  if (!serveur || !pays) return;
  if (config.liste_serveur_bedrock.includes(serveur)) {
    return `bedrock_${pays.toLowerCase()}`;
  }

  return `${serveur.toLowerCase()}_${pays.toLowerCase()}`;
}

function getTeteEmojiKey(joueur) {
  if (!joueur) return;
  return joueur.toLowerCase();
}

function getHexEmojiKey(hexColor) {
  if (!hexColor) return;
  return hexColor.toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

function getBase64EmojiKey(base64) {
  if (!base64) return;
  return crypto.createHash("sha256").update(base64).digest("hex").slice(0, 32);
}

function getCachedEmojiMentionByKey(key, fallback = null) {
  const cacheEntry = emojisCache[key];

  if (!cacheEntry?.emojiId || !cacheEntry?.createdAt) {
    return fallback;
  }

  if (Date.now() - cacheEntry.createdAt >= ONE_HOUR) {
    delete emojisCache[key];
    saveCache();
    return fallback;
  }

  const emojiName = (cacheEntry.nom || key).slice(0, 32);
  return `<:${emojiName}:${cacheEntry.emojiId}>`;
}

function hasCachedEmojiByKey(key) {
  return getCachedEmojiMentionByKey(key) !== null;
}

function getInitialEmojiMap(entries) {
  return new Map(
    entries.map((entry) => [
      entry.key,
      getCachedEmojiMentionByKey(entry.key, entry.fallback || null),
    ]),
  );
}

function hasMissingEmojiEntries(entries) {
  return entries.some((entry) => !hasCachedEmojiByKey(entry.key));
}

async function ensureApplication(client) {
  if (!client.application) {
    await client.application.fetch();
  }
}

function scheduleDeleteEmoji(client, key, emojiId, delay = 60 * 60 * 1000) {
  setTimeout(async () => {
    try {
      await ensureApplication(client);
      const emoji = await client.application.emojis.fetch(emojiId);
      if (emoji) {
        await emoji.delete();
      }
    } catch (error) {
      console.warn(`Erreur suppression emoji ${key}:`, error.message);
    } finally {
      delete emojisCache[key];
      saveCache();
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
    saveCache();
    scheduleDeleteEmoji(client, key, emoji.id);
    return emoji;
  } catch (error) {
    if (error.message.includes("Invalid Form Body")) {
      const emojis = await client.application.emojis.fetch();
      const existing = emojis.find((entry) => entry.name === key.slice(0, 32));

      if (existing) {
        emojisCache[key] = {
          emojiId: existing.id,
          ...extraData,
          createdAt: now,
        };
        saveCache();
        scheduleDeleteEmoji(client, key, existing.id);
        return existing;
      }
    }

    throw error;
  }
}

async function resolveCachedEmoji(client, key) {
  const cacheEntry = emojisCache[key];

  if (!cacheEntry) {
    return null;
  }

  try {
    return await client.application.emojis.fetch(cacheEntry.emojiId);
  } catch {
    delete emojisCache[key];
    saveCache();
    return null;
  }
}

async function getOrCreateEmoji(client, key, factory, extraData = {}) {
  await ensureApplication(client);

  if (pendingEmojis.has(key)) {
    return pendingEmojis.get(key);
  }

  const cachedEmoji = await resolveCachedEmoji(client, key);
  if (cachedEmoji) {
    return cachedEmoji;
  }

  const pendingEmoji = (async () => {
    const buffer = await factory();
    if (!buffer) {
      return null;
    }

    return createOrFetchEmoji(client, key, buffer, extraData);
  })();

  pendingEmojis.set(key, pendingEmoji);

  try {
    return await pendingEmoji;
  } finally {
    if (pendingEmojis.get(key) === pendingEmoji) {
      pendingEmojis.delete(key);
    }
  }
}

async function getEmojiDrapeau(client, serveur, pays) {
  const key = getDrapeauEmojiKey(serveur, pays);

  return getOrCreateEmoji(
    client,
    key,
    async () => {
      if (config.liste_serveur_java.includes(serveur)) {
        const paysDoc = await Pays.findOne({
          server: serveur.toLowerCase(),
          name: new RegExp(`^${pays}$`, "i"),
        });

        if (!paysDoc?.flag) {
          return null;
        }

        return Buffer.from(paysDoc.flag, "base64");
      }

      const url = `https://static.nationsglory.fr/bedrock/flags/${pays}`;
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }

      return Buffer.from(await response.arrayBuffer());
    },
    { nom: key },
  );
}

async function getEmojiTete(client, joueur) {
  const key = getTeteEmojiKey(joueur);

  return getOrCreateEmoji(
    client,
    key,
    async () => {
      const url = `https://skins.nationsglory.fr/face/${joueur}/3d/4`;
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }

      return Buffer.from(await response.arrayBuffer());
    },
    { nom: key },
  );
}

async function getHexEmoji(client, hexColor) {
  const key = getHexEmojiKey(hexColor);

  return getOrCreateEmoji(
    client,
    key,
    async () => {
      const canvas = Canvas.createCanvas(32, 32);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = hexColor;
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();
      return canvas.toBuffer("image/png");
    },
    { nom: key },
  );
}

async function getEmojiBase64(client, base64) {
  const key = getBase64EmojiKey(base64);

  return getOrCreateEmoji(
    client,
    key,
    async () => Buffer.from(base64, "base64"),
    { nom: key },
  );
}

async function resolveEmojiEntries(entries) {
  const resolvedEntries = await Promise.all(
    entries.map(async (entry) => {
      const emoji = await entry.loader();
      return [entry.key, emoji || entry.fallback || null];
    }),
  );

  return new Map(resolvedEntries);
}

async function resolveMissingEmojiEntries(entries, initialMap = null) {
  const resolvedMap = initialMap
    ? new Map(initialMap)
    : getInitialEmojiMap(entries);
  const missingEntries = entries.filter(
    (entry) => !hasCachedEmojiByKey(entry.key),
  );

  if (missingEntries.length === 0) {
    return resolvedMap;
  }

  const fetchedEntries = await Promise.all(
    missingEntries.map(async (entry) => [
      entry.key,
      (await entry.loader()) || entry.fallback || null,
    ]),
  );

  for (const [key, emoji] of fetchedEntries) {
    resolvedMap.set(key, emoji);
  }

  return resolvedMap;
}

function getCachedEmojiDrapeau(serveur, pays, fallback = null) {
  return getCachedEmojiMentionByKey(
    getDrapeauEmojiKey(serveur, pays),
    fallback,
  );
}

function getCachedEmojiTete(joueur, fallback = null) {
  if (!joueur) return fallback;
  return getCachedEmojiMentionByKey(getTeteEmojiKey(joueur), fallback);
}

function getCachedEmojiBase64(base64, fallback = null) {
  if (!base64) return fallback;
  return getCachedEmojiMentionByKey(getBase64EmojiKey(base64), fallback);
}

function getCachedHexEmoji(hexColor, fallback = null) {
  if (!hexColor) return fallback;
  return getCachedEmojiMentionByKey(getHexEmojiKey(hexColor), fallback);
}

function formatResolvedEmoji(emoji, fallback = null) {
  if (!emoji) return fallback;

  if (typeof emoji === "string") return emoji;

  return emoji.toString();
}

async function checkEmojiCache(client) {
  await ensureApplication(client);
  emojisCache = getData(cachePath) || emojisCache || {};
  const now = Date.now();
  for (const [key, { emojiId, createdAt }] of Object.entries(emojisCache)) {
    const age = now - createdAt;

    if (age >= ONE_HOUR) {
      try {
        const emoji = await client.application.emojis.fetch(emojiId);
        if (emoji) {
          await emoji.delete();
        }
      } catch {}

      delete emojisCache[key];
      saveCache();
      continue;
    }

    scheduleDeleteEmoji(client, key, emojiId, ONE_HOUR - age);
  }
}

module.exports = {
  checkEmojiCache,
  getCachedEmojiBase64,
  getCachedEmojiDrapeau,
  getCachedEmojiMentionByKey,
  getCachedEmojiTete,
  getCachedHexEmoji,
  formatResolvedEmoji,
  getEmojiBase64,
  getEmojiDrapeau,
  getEmojiTete,
  getHexEmoji,
  getInitialEmojiMap,
  hasMissingEmojiEntries,
  resolveEmojiEntries,
  resolveMissingEmojiEntries,
};
