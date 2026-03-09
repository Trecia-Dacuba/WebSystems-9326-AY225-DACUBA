/**
 * scraper.js — Kotaku Game Database Scraper (Final)
 *
 * Kotaku game hub pages (kotaku.com/games/[slug]) embed IGDB data as text:
 *   "GenresRPG, Adventure DeveloperStudio Release DateJan 2025 PublisherStudio"
 * Labels are singular OR plural (Genre/Genres, Developer/Developers, etc.)
 * Platforms also appear as "AVAILABLE ON: PC  PS5" on the game page.
 */

const axios   = require("axios");
const cheerio = require("cheerio");
const fs      = require("fs");
const path    = require("path");

const BASE_URL          = "https://kotaku.com";
const GAMES_SECTION_URL = "https://kotaku.com/games";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Connection:        "keep-alive",
  "Cache-Control":   "no-cache",
};

const DELAY_MS    = 1500;
const MAX_RETRIES = 3;

// ─── LISTING PAGE GENRE HEADINGS ─────────────────────────────────────────────
const KOTAKU_LISTING_GENRES = new Set([
  "RPG","Sci-Fi","Racing","Horror","Sport","Sports",
  "Action","Adventure","Shooter","Fighting","Puzzle",
  "Simulation","Strategy","Platformer","Sandbox","Survival",
  "Indie","MMO","Battle Royale","Stealth","Anime",
  "Open World","MOBA","Card Game","Rhythm","Metroidvania",
]);

// ─── IGDB GENRE → CLEAN DISPLAY NAME ─────────────────────────────────────────
const GENRE_MAP = {
  "role-playing (rpg)":          "RPG",
  "role-playing":                "RPG",
  "hack and slash/beat 'em up":  "Hack & Slash",
  "hack and slash":              "Hack & Slash",
  "beat 'em up":                 "Beat 'em Up",
  "turn-based strategy (tbs)":   "Strategy",
  "turn-based strategy":         "Strategy",
  "real-time strategy (rts)":    "Strategy",
  "real-time strategy":          "Strategy",
  "tactical":                    "Strategy",
  "strategy":                    "Strategy",
  "simulator":                   "Simulation",
  "simulation":                  "Simulation",
  "sport":                       "Sports",
  "sports":                      "Sports",
  "music":                       "Rhythm",
  "platform":                    "Platformer",
  "platformer":                  "Platformer",
  "card & board game":           "Card Game",
  "card game":                   "Card Game",
  "point-and-click":             "Adventure",
  "visual novel":                "Visual Novel",
  "indie":                       "Indie",
  "arcade":                      "Arcade",
  "adventure":                   "Adventure",
  "action":                      "Action",
  "shooter":                     "Shooter",
  "fighting":                    "Fighting",
  "puzzle":                      "Puzzle",
  "racing":                      "Racing",
  "horror":                      "Horror",
};

function simplifyGenres(raw) {
  if (!raw || raw === "Not Available") return raw;
  const parts = raw.split(/,\s*/);
  const seen = new Set();
  const out  = [];
  for (const p of parts) {
    const mapped = GENRE_MAP[p.toLowerCase().trim()] || p.trim();
    if (mapped && !seen.has(mapped.toLowerCase())) {
      seen.add(mapped.toLowerCase());
      out.push(mapped);
    }
  }
  return out.slice(0, 3).join(", ");
}

// ─── PLATFORM NORMALISATION ──────────────────────────────────────────────────
// ALL patterns use ^ and $ anchors so "PC PS5" does NOT match /^ps5$/i
const PLATFORM_MAP_STRICT = [
  [/^pc\s*\(microsoft\s*windows\)$|^windows\s*pc$/i,  "PC"],
  [/^playstation\s*5$|^ps\s*5$|^ps5$/i,               "PS5"],
  [/^playstation\s*4$|^ps\s*4$|^ps4$/i,               "PS4"],
  [/^playstation\s*3$|^ps\s*3$/i,                     "PS3"],
  [/^playstation\s*vita$|^ps\s*vita$/i,               "PS Vita"],
  [/^playstation$/i,                                   "PlayStation"],
  [/^xbox\s*series\s*x[/|]s$/i,                       "Xbox Series X|S"],
  [/^xbox\s*series\s*[xs]$/i,                         "Xbox Series X|S"],
  [/^xbox\s*one$/i,                                   "Xbox One"],
  [/^xbox$/i,                                         "Xbox"],
  [/^nintendo\s*switch\s*2$|^switch\s*2$/i,           "Nintendo Switch 2"],
  [/^nintendo\s*switch$|^switch$/i,                   "Nintendo Switch"],
  [/^pc$/i,                                           "PC"],
  [/^macos$|^mac\s*os$|^mac$/i,                       "macOS"],
  [/^linux$/i,                                        "Linux"],
  [/^ios$|^iphone$|^ipad$/i,                          "iOS"],
  [/^android$/i,                                      "Android"],
  [/^steam\s*deck$/i,                                 "Steam Deck"],
  [/^steam$/i,                                        "Steam"],
  [/^wii\s*u$/i,                                      "Wii U"],
  [/^wii$/i,                                          "Wii"],
  [/^3ds$/i,                                          "3DS"],
  [/^ds$/i,                                           "DS"],
  [/^psp$/i,                                          "PSP"],
  [/^game\s*pass$/i,                                  "Game Pass"],
  [/^epic\s*games?\s*(store)?$/i,                     "Epic Games Store"],
];

// Strict: requires full-string match (anchored). Returns null for unknown/multi values.
function normPlatformStrict(raw) {
  const s = String(raw).trim();
  if (!s || s.length < 2 || s.length > 60) return null;
  for (const [re, name] of PLATFORM_MAP_STRICT) {
    if (re.test(s)) return name;
  }
  return null;
}

// Lenient: falls back to returning the string as-is if it looks like a platform name
function normPlatform(raw) {
  const n = normPlatformStrict(raw);
  if (n) return n;
  const s = String(raw).trim();
  if (/^[A-Za-z0-9 |\/\-\.()]+$/.test(s) && s.length < 50) return s;
  return null;
}

// Split an individual part if it contains ONLY space-separated known short platforms.
// e.g. "PC PS5" → ["PC","PS5"] but "Nintendo Switch 2" stays as-is.
function expandPart(p) {
  if (!p.includes(" ")) return [p];
  if (normPlatformStrict(p) !== null) return [p]; // already a known multi-word platform
  const tokens = p.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every(t => normPlatformStrict(t) !== null)) {
    return tokens; // all short tokens are known platforms — split them
  }
  return [p];
}

// Ordered list of multi-word platform names for comma-injection
const SPLIT_WORDS = [
  "PC (Microsoft Windows)", "PlayStation 5", "PlayStation 4", "PlayStation 3",
  "PlayStation Vita", "PlayStation", "Xbox Series X|S", "Xbox Series X/S",
  "Xbox One", "Xbox", "Nintendo Switch 2", "Nintendo Switch",
  "macOS", "Mac", "Linux", "iOS", "Android", "Steam Deck", "Steam",
  "Wii U", "Wii", "3DS", "DS", "PSP", "Game Pass", "Epic Games Store",
].sort((a, b) => b.length - a.length);

function parsePlatforms(raw) {
  if (!raw) return null;
  let s = String(raw).trim();

  if (!s.includes(",")) {
    // Inject commas before known multi-word platform names
    for (const w of SPLIT_WORDS) {
      try {
        s = s.replace(
          new RegExp(`(?<!^)(?=${w.replace(/[()\/|]/g, "\\$&")})`, "gi"),
          ","
        );
      } catch (_) {}
    }
    // If still no comma and all space-tokens are individually known → split on spaces
    if (!s.includes(",") && s.includes(" ")) {
      const tokens = s.split(/\s+/).filter(Boolean);
      if (tokens.every(t => normPlatformStrict(t) !== null)) {
        s = tokens.join(",");
      }
    }
  }

  // Split on commas/newlines, then expand any remaining "PC PS5"-style parts
  const rawParts = s.split(/[,\n]+/).map(p => p.trim()).filter(Boolean);
  const parts    = rawParts.flatMap(expandPart);

  const seen = new Set();
  const out  = [];
  for (const p of parts) {
    const n = normPlatform(p);
    if (n && !seen.has(n)) { seen.add(n); out.push(n); }
  }
  return out.length > 0 ? out.join(", ") : null;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function orNA(v) {
  if (v === null || v === undefined) return "Not Available";
  const s = String(v).trim().replace(/\s+/g, " ");
  return s.length > 0 ? s : "Not Available";
}

function fmtDate(raw) {
  if (!raw) return null;
  const s = String(raw).replace(/\s*\([^)]*ago[^)]*\)\s*/gi, "").trim();
  const d = new Date(s);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1970 && d.getFullYear() < 2100) {
    return d.toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
  }
  if (/[A-Za-z]+ \d{1,2},?\s*\d{4}/.test(s)) return s;
  return s.length > 3 ? s : null;
}

function isBoilerplate(text) {
  if (!text) return true;
  const t = text.trim();
  if (t.length < 20) return true;
  if (/^(news|reviews?|release\s*date|trailers?)\s*(,|and)/i.test(t)) return true;
  if (/^kotaku\.(com|en)|^sign in|^subscribe/i.test(t)) return true;
  return false;
}

// ─── FETCH ───────────────────────────────────────────────────────────────────
async function safeFetch(url) {
  for (let i = 1; i <= MAX_RETRIES; i++) {
    try {
      const r = await axios.get(url, {
        headers: HEADERS, timeout: 30000, maxRedirects: 5, decompress: true,
      });
      return r.data;
    } catch (err) {
      const status = err.response?.status || 0;
      console.warn(`    [${i}/${MAX_RETRIES}] HTTP ${status}: ${err.message}`);
      if ([403, 404, 410].includes(status)) return null;
      if (i < MAX_RETRIES) await sleep(i * 3000);
    }
  }
  return null;
}

// ─── IGDB FIELD EXTRACTOR ────────────────────────────────────────────────────
// Splits the page text at IGDB label boundaries, then strips each label prefix.
// Handles "DeveloperS..." ambiguity where "S" starts the value, not the label suffix.
function extractIgdbFields(fullText) {
  // Allow optional colon after the label name (e.g. "AVAILABLE ON: PC")
  const SPLIT_RE = /(?=(?:Genres?|Platforms?|Developers?|Publishers?|Release\s*Date|Content\s*Rating|Franchises?|AVAILABLE\s*ON)(?=[:A-Z\s0-9]|$))/i;
  const parts = fullText.split(SPLIT_RE).filter(Boolean);
  const result = {};

  // ── Direct extraction of "AVAILABLE ON: <value>" before the split loop ──
  // This catches the case where the colon prevents the split from working
  const availableOnMatch = fullText.match(/AVAILABLE\s+ON\s*:\s*([A-Za-z0-9 ,/|·•\-]+?)(?=\s{2,}|\n|Genres?|Developers?|Publishers?|Release|$)/i);
  if (availableOnMatch) {
    const parsed = parsePlatforms(availableOnMatch[1].trim());
    if (parsed) result.platforms = parsed;
  }

  const LABEL_RE = /^(Genres?|Platforms?|Developers?|Publishers?|Release\s*Date|Content\s*Rating|AVAILABLE\s*ON)/i;
  const FIELD_MAP = {
    "genre": "genre",       "genres": "genre",
    "platform": "platforms","platforms": "platforms",
    "developer": "developer","developers": "developer",
    "publisher": "publisher","publishers": "publisher",
    "release date": "releaseDate",
    "available on": "availableOn",
  };

  for (const part of parts) {
    const labelM = part.match(LABEL_RE);
    if (!labelM) continue;

    let labelText  = labelM[0];
    let valueStart = labelText.length;

    // KEY FIX: "DeveloperSlaclap" — the regex greedily matches "DeveloperS" as the label.
    // Detect this: label ends with uppercase letter that's NOT part of "Release Date" / "Available On".
    // If so, that uppercase letter belongs to the value — strip it from label, prepend to value.
    if (/[A-Z]$/.test(labelText) && !/^(release\s*date|available\s*on)/i.test(labelText)) {
      valueStart = labelText.length - 1;
      labelText  = labelText.slice(0, -1);
    }

    const labelKey = labelText.toLowerCase().replace(/s\s*$/, "").trim(); // strip plural 's'
    const field    = FIELD_MAP[labelKey];
    if (!field || result[field]) continue;

    let value = part.slice(valueStart)
      .replace(/\s*\([^)]*ago[^)]*\)/gi, "")  // strip "(X months ago)"
      .replace(/^[\s·•\-,:]+/, "")             // strip leading separators
      .replace(/[\s·•\-,:]+$/, "")             // strip trailing separators
      .replace(/\s+/g, " ")
      .trim();

    if (!value || value.length < 1 || value.length > 300) continue;

    if (field === "platforms" || field === "availableOn") {
      const parsed = parsePlatforms(value);
      if (parsed) {
        if (field === "availableOn" && !result.platforms) result.platforms = parsed;
        else if (field === "platforms") result.platforms = parsed;
      }
    } else if (field === "releaseDate") {
      const d = fmtDate(value);
      if (d) result[field] = d;
    } else if (field === "genre") {
      result[field] = simplifyGenres(value);
    } else {
      result[field] = value;
    }
  }

  return result;
}

// ─── JSON-LD MINER ───────────────────────────────────────────────────────────
function mineJsonLd($, result) {
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "");
      const objs = [].concat(json["@graph"] || json).flat();
      for (const obj of objs) {
        if (!/VideoGame|SoftwareApplication/i.test(String(obj["@type"] || ""))) continue;
        if (!result.gameTitle && obj.name)
          result.gameTitle = String(obj.name).trim();
        if (!result.description && obj.description && !isBoilerplate(obj.description))
          result.description = String(obj.description).trim().substring(0, 500);
        if (!result.releaseDate) {
          const d = fmtDate(obj.datePublished || obj.dateCreated);
          if (d) result.releaseDate = d;
        }
        if (!result.developer) {
          for (const a of [].concat(obj.author || obj.creator || obj.developer || [])) {
            const n = typeof a === "string" ? a : a?.name;
            if (n) { result.developer = String(n).trim(); break; }
          }
        }
        if (!result.publisher) {
          for (const p of [].concat(obj.publisher || obj.copyrightHolder || [])) {
            const n = typeof p === "string" ? p : p?.name;
            if (n) { result.publisher = String(n).trim(); break; }
          }
        }
        if (!result.platforms && obj.gamePlatform) {
          const raw = [].concat(obj.gamePlatform).join(", ");
          result.platforms = parsePlatforms(raw) || raw;
        }
        if (!result.genre && obj.genre)
          result.genre = simplifyGenres([].concat(obj.genre).join(", "));
        if (!result.thumbnail) {
          const img = obj.image || obj.thumbnailUrl;
          const url = typeof img === "string" ? img : (img?.url || img?.contentUrl);
          if (url && /^https?:\/\/.+/i.test(String(url))) result.thumbnail = String(url).trim();
        }
        break;
      }
    } catch (_) {}
  });
}

// ─── STEP 1: SCRAPE LISTING PAGE ─────────────────────────────────────────────
async function scrapeListingPage(pageUrl) {
  console.log(`\n  Fetching listing: ${pageUrl}`);
  const html = await safeFetch(pageUrl);
  if (!html) { console.error("  Listing page unreachable"); return []; }

  const $    = cheerio.load(html);
  const seen = new Set();
  const stubs = [];
  let currentGenre = "Unknown";

  $("*").each((_, el) => {
    const tag = (el.name || "").toLowerCase();
    const $el = $(el);

    if (["h1","h2","h3","h4"].includes(tag)) {
      const text = $el.text().trim();
      if (KOTAKU_LISTING_GENRES.has(text)) {
        currentGenre = text;
        console.log(`  [Genre] ${currentGenre}`);
      }
      return;
    }

    if (tag !== "a") return;
    const href = ($el.attr("href") || "").trim();
    if (!/^(https?:\/\/kotaku\.com)?\/games\/[a-z0-9][a-z0-9-]+\/?$/.test(href)) return;

    const fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
    if (seen.has(fullUrl)) return;
    seen.add(fullUrl);

    const slug = fullUrl.replace(/.*\/games\//, "").replace(/\/$/, "");

    let gameTitle = $el.find("img").first().attr("alt")?.trim() || "";
    if (!gameTitle || gameTitle.length > 120)
      gameTitle = $el.find("h1,h2,h3,h4,h5,strong,b").first().text().trim();
    if (!gameTitle)
      gameTitle = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

    const skip = new Set(["games","more","see all","load more","latest","reviews","news","downloads","deals"]);
    if (skip.has(gameTitle.toLowerCase()) || gameTitle.length < 2) return;

    // Developer: short text directly below the title in the card
    let developer = "";
    const titleLower = gameTitle.toLowerCase();
    $el.find("span, p, h3, h4").each((_, child) => {
      if (developer) return;
      const $c = $(child);
      if ($c.children("div,p,ul,ol,a").length > 0) return;
      const t = $c.text().trim();
      if (t.length < 2 || t.length > 80) return;
      if (t.toLowerCase() === titleLower) return;
      if (/^https?:\/\//.test(t)) return;
      if (KOTAKU_LISTING_GENRES.has(t)) return;
      developer = t;
    });

    const thumbnail =
      $el.find("img").first().attr("src") ||
      $el.find("img").first().attr("data-src") ||
      $el.find("img").first().attr("data-lazy-src") || "";

    console.log(`    [${currentGenre}] "${gameTitle}" | Dev: "${developer || '—'}"`);
    stubs.push({ gameTitle, developer, genre: currentGenre, thumbnail, gameUrl: fullUrl, slug });
  });

  console.log(`\n  Total: ${stubs.length} stubs found`);
  return stubs;
}

// ─── STEP 2: SCRAPE GAME HUB PAGE ────────────────────────────────────────────
async function scrapeGamePage(stub) {
  const { gameUrl, gameTitle, developer: listingDev, genre, thumbnail } = stub;

  const record = {
    gameTitle:   orNA(gameTitle),
    releaseDate: "Not Available",
    keyFeatures: "Not Available",
    platforms:   "Not Available",
    developer:   orNA(listingDev),
    publisher:   "Not Available",
    genre:       orNA(genre),
    thumbnail,
    sourceUrl:   gameUrl,
    tags:        [],
    scrapedAt:   new Date().toISOString(),
  };

  const html = await safeFetch(gameUrl);
  if (!html) return record;

  const $ = cheerio.load(html);

  // ── Priority 1: IGDB panel (primary source) ───────────────────────────────
  const fullText = $("body").text().replace(/\s+/g, " ");
  const igdb = extractIgdbFields(fullText);

  if (igdb.genre)       record.genre       = orNA(igdb.genre);
  if (igdb.platforms)   record.platforms   = orNA(igdb.platforms);
  if (igdb.developer)   record.developer   = orNA(igdb.developer);
  if (igdb.publisher)   record.publisher   = orNA(igdb.publisher);
  if (igdb.releaseDate) record.releaseDate = orNA(igdb.releaseDate);

  // ── Priority 2: JSON-LD VideoGame schema (gap fill) ──────────────────────
  const ld = {};
  mineJsonLd($, ld);
  if (!record.gameTitle  || record.gameTitle  === "Not Available") if (ld.gameTitle)   record.gameTitle   = orNA(ld.gameTitle);
  if (record.platforms   === "Not Available")                      if (ld.platforms)   record.platforms   = orNA(ld.platforms);
  if (record.developer   === "Not Available")                      if (ld.developer)   record.developer   = orNA(ld.developer);
  if (record.publisher   === "Not Available")                      if (ld.publisher)   record.publisher   = orNA(ld.publisher);
  if (record.releaseDate === "Not Available")                      if (ld.releaseDate) record.releaseDate = orNA(ld.releaseDate);
  if (record.genre       === "Not Available")                      if (ld.genre)       record.genre       = orNA(ld.genre);
  if (ld.description && !isBoilerplate(ld.description))
    record.keyFeatures = orNA(ld.description);

  // ── Priority 3: og: meta tags ─────────────────────────────────────────────
  if (!record.gameTitle || record.gameTitle === "Not Available") {
    const og = $('meta[property="og:title"]').attr("content");
    if (og) record.gameTitle = og.split("|")[0].split(" - ")[0].trim();
  }
  if (record.keyFeatures === "Not Available") {
    const ogDesc = $('meta[property="og:description"]').attr("content") || "";
    if (ogDesc.length > 20 && !isBoilerplate(ogDesc)) record.keyFeatures = ogDesc.trim();
  }
  if (!record.thumbnail || record.thumbnail.length < 5) {
    record.thumbnail =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") || "";
  }

  // ── Priority 4: First real paragraph for keyFeatures ─────────────────────
  if (record.keyFeatures === "Not Available") {
    $("p").each((_, el) => {
      if (record.keyFeatures !== "Not Available") return;
      const t = $(el).text().trim();
      if (t.length > 80 && !isBoilerplate(t))
        record.keyFeatures = t.length > 400 ? t.substring(0, 397) + "..." : t;
    });
  }

  // ── Priority 5: h1 fallback for title ────────────────────────────────────
  if (!record.gameTitle || record.gameTitle === "Not Available")
    record.gameTitle = orNA($("h1").first().text().trim());

  // Fix HTML entities in title
  record.gameTitle = record.gameTitle
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&amp;/g, "&");

  // Tags
  const tags = [];
  $('a[rel="tag"], [class*="tag"] a').each((_, el) => {
    const t = $(el).text().trim();
    if (t && t.length < 40) tags.push(t);
  });
  record.tags = [...new Set(tags)].slice(0, 5);

  console.log(
    `  ✓ "${record.gameTitle}" | ${record.genre} | ` +
    `Dev: ${record.developer} | Pub: ${record.publisher} | ` +
    `Plat: ${record.platforms} | Date: ${record.releaseDate}`
  );
  return record;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function scrapeKotakuGames(targetUrl = GAMES_SECTION_URL) {
  console.log("\n" + "=".repeat(60));
  console.log("  KOTAKU GAME DATABASE SCRAPER");
  console.log(`  URL: ${targetUrl}`);
  console.log("=".repeat(60));

  const stubs = await scrapeListingPage(targetUrl);
  if (!stubs.length) { console.error("\n  No games found."); return []; }

  const games = [];
  for (let i = 0; i < stubs.length; i++) {
    const stub = stubs[i];
    console.log(`\n[${i + 1}/${stubs.length}] ${stub.gameTitle}`);
    const record = await scrapeGamePage(stub);
    if (record) games.push(record);
    if (i < stubs.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  DONE — ${games.length} games`);
  const n   = games.length;
  const pct = f => games.filter(g => g[f] !== "Not Available").length;
  console.log(`  Dev:${pct("developer")}/${n}  Pub:${pct("publisher")}/${n}  Plat:${pct("platforms")}/${n}  Date:${pct("releaseDate")}/${n}  Feat:${pct("keyFeatures")}/${n}`);
  console.log("=".repeat(60) + "\n");

  return games;
}

// ─── SAVE ────────────────────────────────────────────────────────────────────
function saveToJSON(games, filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(games, null, 2), "utf-8");
  console.log(`  Saved JSON → ${filePath} (${games.length} records)`);
}

function saveToCSV(games, filePath) {
  if (!games.length) return;
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const headers = ["gameTitle","releaseDate","keyFeatures","platforms","developer","publisher","genre","sourceUrl","scrapedAt"];
  const esc = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  const rows = [headers.join(","), ...games.map(g => headers.map(h => esc(g[h])).join(","))];
  fs.writeFileSync(filePath, rows.join("\n"), "utf-8");
  console.log(`  Saved CSV  → ${filePath} (${games.length} records)`);
}

if (require.main === module) {
  (async () => {
    const url   = process.argv[2] || GAMES_SECTION_URL;
    const games = await scrapeKotakuGames(url);
    saveToJSON(games, path.join(__dirname, "data", "games.json"));
    saveToCSV(games,  path.join(__dirname, "data", "games.csv"));
  })();
}

module.exports = { scrapeKotakuGames, saveToJSON, saveToCSV, GAMES_SECTION_URL };