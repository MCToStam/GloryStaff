const CACHE_DURATION = 2 * 60 * 1000;
const cache = new Map();
const config = require("../../config");

async function getServerPlayer(server) {
  const now = Date.now();
  const cached = cache.get(server);

  if (cached) {
    if (cached.expires > now) return cached.value;
    if (cached.promise) return cached.promise;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(
        `${config.glorybot_url}/api/joueurConnecte?serveur=${server}&administrator=true`,
      );
      if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
      const data = await res.json();
      const value =
        Array.isArray(data) && (data[0]?.nombre !== undefined) !== undefined
          ? { nombre: data[0].nombre || 0, liste: data[0].joueur || [] }
          : { nombre: 0, liste: [] };

      cache.set(server, { value, expires: Date.now() + CACHE_DURATION });
      return value;
    } catch (e) {
      cache.delete(server);
      return { nombre: 0, liste: [] };
    }
  })();

  cache.set(server, { promise: fetchPromise, expires: now + CACHE_DURATION });

  return fetchPromise;
}

module.exports = getServerPlayer;
