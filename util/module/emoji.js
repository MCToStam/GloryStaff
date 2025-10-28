const Canvas = require("canvas");
const { getData, saveData } = require("../../util/module/getAndSaveData");
const { AttachmentBuilder } = require("discord.js");

let emojisCache = getData("data/emojisCache.json");

let guildCache = null;

async function getEmojiTete(client, joueur) {
  const key = joueur.toLowerCase();
  const now = Date.now();

  if (!guildCache) {
    guildCache = await client.guilds.fetch("1430498144436879492");
  }
  const guild = guildCache;

  if (emojisCache[key]) {
    const cached = guild.emojis.cache.get(emojisCache[key].emojiId);
    if (cached) return cached;
  }

  const url = `https://skins.nationsglory.fr/face/${joueur}/3d/4`;
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Impossible de récupérer l'image pour ${joueur}`);

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const attachment = new AttachmentBuilder(buffer, { name: `${key}.png` });

  const emoji = await guild.emojis.create({
    attachment: attachment.attachment,
    name: key.slice(0, 32),
  });

  emojisCache[key] = {
    emojiId: emoji.id,
    nom: joueur,
    createdAt: now,
  };
  saveData("data/emojisCache.json", emojisCache);

  return emoji;
}

async function getHexEmoji(client, hexColor) {
  const now = Date.now();
  const key = hexColor.toLowerCase();
  const colorKey = hexColor.toLowerCase();

  if (!guildCache) {
    guildCache = await client.guilds.fetch("1349379748576366633");
  }
  const guild = guildCache;

  const existingColorEmoji = Object.values(emojisCache).find(
    (e) => e.color === colorKey,
  );
  if (existingColorEmoji) {
    const emoji = guild.emojis.cache.get(existingColorEmoji.emojiId);
    if (emoji) {
      emojisCache[hexColor] = {
        emojiId: emoji.id,
        color: colorKey,
        createdAt: now,
      };
      saveData("data/emojisCache.json", emojisCache);
      return emoji;
    }
  }

  const canvas = Canvas.createCanvas(32, 32);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = hexColor;
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();

  const safeKey = key.toLowerCase().replace(/[^a-z0-9_]/g, "_");

  const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), {
    name: `${safeKey}.png`,
  });
  const emoji = await guild.emojis.create({
    attachment: attachment.attachment,
    name: colorKey.replace(/[^a-z0-9_]/gi, "_").slice(0, 32),
  });

  emojisCache[key] = {
    emojiId: emoji.id,
    color: colorKey,
    createdAt: now,
  };
  saveData("data/emojisCache.json", emojisCache);

  setTimeout(
    async () => {
      try {
        const stillHere = guild.emojis.cache.get(emoji.id);
        if (stillHere) await stillHere.delete();
        delete emojisCache[key];
        saveData("data/emojisCache.json", emojisCache);
      } catch (e) {
        console.warn(`Erreur suppression emoji ${emoji.id}:`, e.message);
      }
    },
    60 * 60 * 1000,
  );

  return emoji;
}

async function checkEmojiCache(client) {
  if (!guildCache) {
    guildCache = await client.guilds.fetch("1430498144436879492");
  }
  const guild = guildCache;

  try {
    const now = Date.now();

    for (const [key, { emojiId, createdAt }] of Object.entries(emojisCache)) {
      const emoji = guild.emojis.cache.get(emojiId);

      if (!emoji) {
        delete emojisCache[key];
        continue;
      }

      const age = now - createdAt;
      const oneHour = 60 * 60 * 1000;

      if (age >= oneHour) {
        try {
          await emoji.delete();
          console.log(`🗑️ Emoji ${emoji.name} supprimé (expiré)`);
        } catch (e) {
          console.warn(
            `⚠️ Impossible de supprimer l'emoji ${emojiId}:`,
            e.message,
          );
        }
        delete emojisCache[key];
      } else {
        const timeLeft = oneHour - age;
        setTimeout(async () => {
          try {
            const stillHere = guild.emojis.cache.get(emojiId);
            if (stillHere) {
              await stillHere.delete();
              console.log(`🗑️ Emoji ${stillHere.name} supprimé (planifié)`);
            }
            delete emojisCache[key];
            saveData("data/emojisCache.json", emojisCache);
          } catch (e) {
            console.warn(`⚠️ Erreur suppression emoji ${emojiId}:`, e.message);
          }
        }, timeLeft);
      }
    }

    saveData("data/emojisCache.json", emojisCache);
  } catch (e) {}
}

module.exports = { checkEmojiCache, getEmojiTete, getHexEmoji };
