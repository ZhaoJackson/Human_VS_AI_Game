/**
 * Sampling-without-replacement pool for game questions.
 *
 * Granularity: every unique (prompt-entry × humanIndex × aiIndex) triplet is
 * treated as one independent "question experience". This means:
 *
 *   Entry with 2 humans + 1 AI  →  2 experiences: (h1,a1), (h2,a1)
 *   Entry with 1 human + 3 AIs  →  3 experiences: (h1,a1), (h1,a2), (h1,a3)
 *   Entry with 3 humans + 3 AIs →  3 experiences: (h1,a1), (h2,a2), (h3,a3)
 *
 * Pairing rule: cycle the shorter list to match the longer one
 *   (max(N, M) unique combinations, no exact pair repeats within a cycle).
 *
 * Pool IDs stored in localStorage: "MH-015:0", "MH-015:1", "MH-028:0", …
 * Once every triplet has been seen the pool auto-resets (new cycle).
 */

/** Fisher-Yates in-place shuffle — returns the same array */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function storageKey(category) {
  return 'turing:pool:' + (category?.trim() || 'mixed');
}

/**
 * Build the full list of triplet IDs for a single data entry.
 * Each ID encodes entryId + experienceIndex: "MH-015:0", "MH-015:1", …
 *
 * @param {Object} entry - one item from turing_data
 * @returns {string[]}
 */
export function buildTripletIds(entry) {
  const humanKeys = Object.keys(entry)
    .filter(k => /^human\d+$/.test(k) && entry[k])
    .sort((a, b) => Number(a.replace('human', '')) - Number(b.replace('human', '')));
  const aiKeys = Object.keys(entry)
    .filter(k => /^ai\d+$/.test(k) && !k.startsWith('aiSource') && entry[k])
    .sort((a, b) => Number(a.replace('ai', '')) - Number(b.replace('ai', '')));

  if (!humanKeys.length || !aiKeys.length) return [];

  const count = Math.max(humanKeys.length, aiKeys.length);
  const ids = [];
  for (let i = 0; i < count; i++) {
    ids.push(`${entry.id}:${i}`);
  }
  return ids;
}

/**
 * Resolve a triplet ID back to the concrete { human, ai, aiSource } values.
 *
 * @param {Object} entry          - the parent data entry
 * @param {number} experienceIdx  - the index within the entry's experience list
 * @returns {{ human: string, ai: string, aiSource: string }}
 */
export function resolveTriplet(entry, experienceIdx) {
  const humanKeys = Object.keys(entry)
    .filter(k => /^human\d+$/.test(k) && entry[k])
    .sort((a, b) => Number(a.replace('human', '')) - Number(b.replace('human', '')));
  const aiKeys = Object.keys(entry)
    .filter(k => /^ai\d+$/.test(k) && !k.startsWith('aiSource') && entry[k])
    .sort((a, b) => Number(a.replace('ai', '')) - Number(b.replace('ai', '')));

  const hKey = humanKeys[experienceIdx % humanKeys.length];
  const aKey = aiKeys[experienceIdx % aiKeys.length];
  const aNum = aKey.replace('ai', '');

  return {
    human:    entry[hKey],
    ai:       entry[aKey],
    aiSource: entry['aiSource' + aNum] || '',
  };
}

/**
 * Pick `count` triplet IDs from the category's pool without replacement.
 *
 * Algorithm:
 *  1. Load remaining pool from localStorage; drop stale IDs.
 *  2. Pool empty → refill with a fresh shuffle of allTripletIds (new cycle).
 *  3. Pull first `count` IDs from the front.
 *  4. Pool runs out mid-pick → start a new cycle for the remainder,
 *     avoiding immediate re-use of IDs from this same round.
 *  5. Persist the updated pool.
 *
 * @param {string}   category       - condition name or '' for mixed
 * @param {string[]} allTripletIds  - every valid triplet ID for this category
 * @param {number}   count          - how many to pick (default 3)
 * @returns {string[]}              - picked triplet IDs
 */
export function pickFromPool(category, allTripletIds, count = 3) {
  if (!allTripletIds.length) return [];
  if (typeof window === 'undefined') {
    return shuffle([...allTripletIds]).slice(0, count);
  }

  const key = storageKey(category);
  let remaining = [];

  try {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        remaining = parsed.filter(id => allTripletIds.includes(id));
      }
    }
  } catch (_) {
    remaining = [];
  }

  if (remaining.length === 0) {
    remaining = shuffle([...allTripletIds]);
  }

  const picked = [];

  while (picked.length < count && remaining.length > 0) {
    picked.push(remaining.shift());
  }

  // Pool exhausted mid-round → start a new cycle for the remainder
  if (picked.length < count) {
    const justUsed = new Set(picked);
    let freshPool = shuffle(allTripletIds.filter(id => !justUsed.has(id)));

    if (freshPool.length === 0) {
      // All triplets fit in one round — allow wrap with no same-round repeats where possible
      freshPool = shuffle([...allTripletIds]);
    }

    while (picked.length < count && freshPool.length > 0) {
      picked.push(freshPool.shift());
    }

    remaining = freshPool;
  }

  // Pre-warm the next cycle if pool is now empty
  if (remaining.length === 0) {
    const usedThisRound = new Set(picked);
    remaining = shuffle(allTripletIds.filter(id => !usedThisRound.has(id)));
    if (remaining.length === 0) remaining = shuffle([...allTripletIds]);
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(remaining));
  } catch (_) { /* storage quota — silent */ }

  return picked;
}

/**
 * Clear the pool for a specific category (or all pools when category is null).
 *
 * @param {string|null} category  - condition name, '' for mixed, or null for ALL
 */
export function clearPool(category = null) {
  if (typeof window === 'undefined') return;
  if (category === null) {
    Object.keys(window.localStorage)
      .filter(k => k.startsWith('turing:pool:'))
      .forEach(k => window.localStorage.removeItem(k));
  } else {
    window.localStorage.removeItem(storageKey(category));
  }
}
