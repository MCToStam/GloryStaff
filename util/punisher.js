const punisherCache = {};
const CACHE_DURATION = 10 * 60 * 1000;

const UNITS = {
  y: { order: 0, sing: "an", plur: "ans" },
  mois: { order: 1, sing: "mois", plur: "mois" },
  j: { order: 2, sing: "jour", plur: "jours" },
  h: { order: 3, sing: "heure", plur: "heures" },
  m: { order: 4, sing: "minute", plur: "minutes" },
  s: { order: 5, sing: "seconde", plur: "secondes" },
};

function formatDuree(duree = "") {
  return [...duree.matchAll(/(\d+)(y|mois|j|h|m|s)/g)]
    .map(([_, v, u]) => ({ v: +v, u, ...UNITS[u] }))
    .sort((a, b) => a.order - b.order)
    .map(({ v, sing, plur, u }) => `${v} ${v > 1 ? plur : sing || u}`)
    .join(" ");
}

async function fetchSanctionsServeur(serveur, joueur, page) {
  const res = await fetch(
    `https://apiv2.nationsglory.fr/plugins/api/user/${serveur}/${joueur}/get_punisher/${page}`
  );
  const text = await res.text();
  if (text.includes("No sanction registered")) return [];

  return text
    .split("###")
    .slice(1)
    .map((entry) => {
      const clean = entry.replace(/&[0-9a-fklmnor]/gi, "").trim();
      const match = clean.match(
        /\[Punisher\] \[(\w+) · (.+?)\] '(.+?)' by (.+?) on (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/
      );
      return match && {
        serveur,
        type: match[1],
        duree: formatDuree(match[2]),
        raison: match[3],
        staff: match[4],
        date: new Date(match[5]),
      };
    })
    .filter(Boolean);
}

function getCache(joueur, serveur) {
  if (!punisherCache[joueur]) punisherCache[joueur] = {};
  const cache = punisherCache[joueur][serveur];
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) return cache;
  return (punisherCache[joueur][serveur] = {
    timestamp: Date.now(),
    sanctions: [],
    fetched: [],
    exhausted: false,
  });
}

async function ensureSanctions(joueur, neededCount, config, serveurs = config.liste_serveur) {
  const allSanctions = [];

  for (const serveur of serveurs) {
    const cache = getCache(joueur, serveur);

    if (cache.sanctions.length < neededCount && !cache.exhausted) {
      const page = cache.fetched.length + 1;
      const newSanctions = await fetchSanctionsServeur(serveur, joueur, page);
      if (newSanctions.length) {
        cache.fetched.push(page);
        cache.sanctions.push(...newSanctions);
      } else cache.exhausted = true;
    }

    allSanctions.push(...cache.sanctions);
  }

  return allSanctions.sort((a, b) => b.date - a.date);
}

module.exports = { ensureSanctions };