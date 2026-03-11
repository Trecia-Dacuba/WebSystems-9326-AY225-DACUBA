/**
 * server.js
 * Express backend — serves the web UI and exposes the scraping API
 *
 *  GET  /              → serves public/index.html
 *  GET  /api/games     → returns cached games JSON
 *  POST /api/scrape    → triggers a fresh scrape { url? }
 *  GET  /api/export/csv → downloads games as CSV
 */

const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const {
  scrapeKotakuGames,
  saveToJSON,
  saveToCSV,
  GAMES_SECTION_URL,
} = require("./scraper");

// ──────────────────────────────────────────────
// SETUP
// ──────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_JSON = path.join(__dirname, "data", "games.json");
const DATA_CSV = path.join(__dirname, "data", "games.csv");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, "data"))) {
  fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });
}

// ──────────────────────────────────────────────
// CLEAR OLD DATA ON EVERY SERVER START
// ──────────────────────────────────────────────
[DATA_JSON, DATA_CSV].forEach((file) => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`🗑️  Cleared old data: ${path.basename(file)}`);
  }
});

// ──────────────────────────────────────────────
// STATE — simple in-process scrape lock
// ──────────────────────────────────────────────
let scrapeInProgress = false;
let lastScrapeTime = null;
let lastScrapeError = null;

// ──────────────────────────────────────────────
// ROUTES
// ──────────────────────────────────────────────

/** GET /api/status — server health + scrape state */
app.get("/api/status", (req, res) => {
  res.json({
    ok: true,
    scrapeInProgress,
    lastScrapeTime,
    lastScrapeError,
    gamesCount: loadGamesFromDisk().length,
  });
});

/** GET /api/games — return cached games, with optional search/filter */
app.get("/api/games", (req, res) => {
  const allLoaded = loadGamesFromDisk();
  let games = [...allLoaded];

  const { q, platform, genre, sortBy } = req.query;

  // Full-text search
  if (q) {
    const query = q.toLowerCase();
    games = games.filter(
      (g) =>
        (g.gameTitle  || "").toLowerCase().includes(query) ||
        (g.keyFeatures|| "").toLowerCase().includes(query) ||
        (g.developer  || "").toLowerCase().includes(query) ||
        (g.publisher  || "").toLowerCase().includes(query) ||
        (g.genre      || "").toLowerCase().includes(query)
    );
  }

  // Platform filter — match any part of the comma-separated platforms string
  if (platform && platform !== "all") {
    games = games.filter((g) =>
      (g.platforms || "").toLowerCase().includes(platform.toLowerCase())
    );
  }

  // Genre filter — exact match
  if (genre && genre !== "all") {
    games = games.filter((g) =>
      (g.genre || "").toLowerCase() === genre.toLowerCase()
    );
  }

  // Sort
  if (sortBy === "title") {
    games.sort((a, b) => a.gameTitle.localeCompare(b.gameTitle));
  } else if (sortBy === "date") {
    games.sort((a, b) => new Date(b.scrapedAt) - new Date(a.scrapedAt));
  }

  // Build unique genre list from ALL games (unfiltered) for dropdown
  const genres = [...new Set(
    allLoaded
      .map(g => (g.genre || "").trim())
      .filter(g => g && g !== "Not Available" && g !== "Unknown")
  )].sort();

  // Build unique platform list from ALL games (unfiltered)
  const platformSet = new Set();
  for (const g of allLoaded) {
    if (g.platforms && g.platforms !== "Not Available") {
      g.platforms.split(",").map(p => p.trim()).filter(Boolean).forEach(p => platformSet.add(p));
    }
  }
  const platforms = [...platformSet].sort();

  res.json({
    count: games.length,
    games,
    lastScrapeTime,
    genres,
    platforms,
  });
});

/** POST /api/scrape — trigger a fresh scrape */
app.post("/api/scrape", async (req, res) => {
  if (scrapeInProgress) {
    return res.status(409).json({
      error: "A scrape is already in progress. Please wait.",
    });
  }

  const targetUrl = req.body?.url || GAMES_SECTION_URL;

  // Validate URL
  try {
    const parsed = new URL(targetUrl);
    if (!parsed.hostname.includes("kotaku.com")) {
      return res.status(400).json({
        error: "URL must be from kotaku.com",
      });
    }
  } catch (_) {
    return res.status(400).json({ error: "Invalid URL provided." });
  }

  // Kick off async scrape — respond immediately
  scrapeInProgress = true;
  lastScrapeError = null;
  res.json({ message: "Scrape started!", targetUrl });

  try {
    console.log(`\n🚀 Scrape triggered via API → ${targetUrl}`);
    const games = await scrapeKotakuGames(targetUrl);
    saveToJSON(games, DATA_JSON);
    saveToCSV(games, DATA_CSV);
    lastScrapeTime = new Date().toISOString();
    console.log(`✅ Scrape complete — ${games.length} games saved.`);
  } catch (err) {
    lastScrapeError = err.message;
    console.error("❌ Scrape failed:", err.message);
  } finally {
    scrapeInProgress = false;
  }
});

/** GET /api/export/csv — download CSV */
app.get("/api/export/csv", (req, res) => {
  if (!fs.existsSync(DATA_CSV)) {
    return res.status(404).json({ error: "No CSV available. Run a scrape first." });
  }
  res.download(DATA_CSV, "kotaku_games.csv");
});

/** GET /api/export/json — download JSON */
app.get("/api/export/json", (req, res) => {
  if (!fs.existsSync(DATA_JSON)) {
    return res.status(404).json({ error: "No JSON available. Run a scrape first." });
  }
  res.download(DATA_JSON, "kotaku_games.json");
});

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

function loadGamesFromDisk() {
  try {
    if (fs.existsSync(DATA_JSON)) {
      return JSON.parse(fs.readFileSync(DATA_JSON, "utf-8"));
    }
  } catch (_) {}
  return [];
}

// ──────────────────────────────────────────────
// START
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("  🎮  KOTAKU SCRAPER SERVER");
  console.log("=".repeat(60));
  console.log(`  🌐 Web UI   → http://localhost:${PORT}`);
  console.log(`  📡 API      → http://localhost:${PORT}/api/games`);
  console.log(`  ▶  Scrape   → POST http://localhost:${PORT}/api/scrape`);
  console.log("=".repeat(60) + "\n");
});